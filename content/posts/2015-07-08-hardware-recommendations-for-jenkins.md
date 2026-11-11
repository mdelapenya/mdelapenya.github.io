---
title: "Hardware Recommendations for Jenkins"
date: 2015-07-08T06:50:43+02:00
description: "How to size the hardware for Jenkins masters and slaves, with the real setups of Netflix and Yahoo as a reference."
categories: jenkins
tags: [jenkins, hardware]
type: post
weight: 25
translationKey: hardware-recommendations-for-jenkins
translatedFrom: 76c0fc6
aliases: ["/posts/2015-07-08-recomendaciones-hardware-jenkins/"]
---

*All of this comes from the CloudBees technical paper "Jenkins Continuous Integration Cookbook", which I translated into Spanish in the original version of this post.*

# Introduction
The size of a Jenkins installation depends on many factors, which makes sizing a completely inexact science. Getting an optimal setup takes experience, but you can make a smart first estimate, especially if you design with Jenkins best practices in mind.

This post tries to highlight those factors and how you can take them into account when sizing your setup. It also shows some example configurations, and the hardware behind some of the largest Jenkins installations, presented at the Jenkins Scalability Summit.

# Choosing the Right Hardware for Master Nodes
One of the biggest challenges when setting up a Jenkins instance properly for the first time is that there is no one size that fits every use case. The exact hardware you need will be tied closely to the present and future needs of your organization.

The Jenkins master node serves HTTP requests and stores all the information of your Jenkins instance in its $JENKINS_HOME directory: configurations, build histories, installed plugins, etc.

Keep in mind that masters running in high availability with the CloudBees "High Availability plugin" need $JENKINS_HOME on a network data server, reachable by the Jenkins servers over NFS or some other file-sharing protocol.

> *For more information on sizing master nodes based on organizational needs, please see 'Architecting for Scale' [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_right_sizing_jenkins_masters.html#_calculating_how_many_jobs_masters_and_executors_are_needed](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_right_sizing_jenkins_masters.html#_calculating_how_many_jobs_masters_and_executors_are_needed)*

## Memory Requirements for Master Nodes
The amount of memory Jenkins needs depends on many factors, so the RAM allocated to the process can range from 200MB for a small installation to more than 70GB for a single master. Still, you should be able to estimate the RAM you need based on the builds your project requires.

Each connection from a build to a node uses 2 to 3 threads, which comes to about 2MB or more of memory. You will also need to size the CPU load for Jenkins if many users access the user interface.

In general, it is bad practice to assign executors on a master node. Builds could overload the master's memory or CPU and bring the instance down for no good reason. It is much better to set up slave nodes that the master can delegate jobs to. That way most of the workload happens outside the master itself.

# Choosing the Right Slave Machines
The heart of Jenkins is its ability to orchestrate builds. But installations that do not use the distributed build architecture of Jenkins are artificially limiting the number of builds their masters can orchestrate.

> *More information about the benefits of a distributed architecture can be found here: [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_architecting_for_scale.html#_distributed_builds_architecture](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_architecting_for_scale.html#_distributed_builds_architecture)*

## Requirements for a Machine to Be Used as a Slave Node

Slave machines are typically generic x86 machines with enough memory to run specific projects. Their configuration depends on the projects to build and the tools they need.

Setting up a machine to become a slave in your infrastructure can be a tedious, time-consuming task. That is especially true when the same configuration has to be replicated across a large set of slaves. This is where the idea of a "fungible" slave comes in: a slave that is easily replaceable. Slaves should be generic for all builds, rather than customized for a specific job or jobs. The more generic the slaves, the easier they are to swap. That means better use of resources and less impact on productivity when a slave has a problem.

> Andrew Bayer introduced this concept of *"fungibility"* applied to slaves in his talk "Seven Habits of Highly Effective Jenkins Users", at the Jenkins User Conference Europe in 2014. You can find it here: [http://www.slideshare.net/andrewbayer/seven-habits-of-highly-effective-jenkins-users-2014-edition](http://www.slideshare.net/andrewbayer/seven-habits-of-highly-effective-jenkins-users-2014-edition)

The more automated the configuration of the environment, the easier it is to replicate a setup on a new slave machine. Configuration management tools or preconfigured images can be excellent solutions for this. Containers and virtualization are also popular for creating generic slaves.

> More information about estimating the number of executors needed in a given environment can be found in the "Architecting for Scale" section [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/_architecting_for_scale.html](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/_architecting_for_scale.html)

# Use Cases Published Online

## Netflix
At the Scalability Summit, Gareth Bowles (Senior Build/Tool Engineer at Netflix) explained how Netflix built its installation, including the problems they ran into.

In 2012, Netflix had the following setup:

- 1 master
  - 700 engineers on a single master
- Elastic slaves on Amazon EC2 + 40 ad-hoc slaves in the Netflix data center
- 1,600 jobs
  - 2,000 builds a day
  - 2 TB of job data
  - 15% failed builds
- Hardware configuration
  - 2x quad core x86_64 for the master
  - 26G of RAM
  - m1.xlarge slave machines on AWS

In 2013, Netflix split up the monolith it had as a master and significantly increased the number of jobs and builds:

- 6 masters
  - 700 engineers on each master
- 100 slaves
  - 250 executors, with 4 executors per slave on average
- 3,200 jobs
  - 3 TB of job data
  - 15% failed builds

## Yahoo
Mujibur Wahab, from Yahoo, also presented at the Scalability Summit the gigantic installation they had in 2013:

- 1 primary master
  - 1,000 engineers relying on this Jenkins instance
  - 3 backup masters
  - $JENKINS_HOME hosted on NetApp
- 50 slaves in 3 data centers
  - 400+ executors
- 13,000 jobs
  - 8,000 builds/day
  - 20% build failure rate
  - 2 million builds a year, with a target of 1 million per quarter.
- Hardware configuration
  - 2 x Xeon E5645 2.40GHz, 4.80GT QPI (HT enabled, 12 cores, 24 threads)
  - 96G RAM
  - 1.2TB of disk capacity
  - 48GB max JVM heap
  - 20TB Filer volume to store build and job data
  - This volume stores 6TB of build data.

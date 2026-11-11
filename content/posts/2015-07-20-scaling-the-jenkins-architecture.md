---
title: "Scaling the Jenkins Architecture"
date: 2015-07-20T12:55:59+02:00
description: "Vertical or horizontal growth, master/slave communication and fungible build slaves: how to scale a Jenkins installation as your organization matures."
categories: jenkins
tags: [jenkins, hardware]
type: post
weight: 25
translationKey: scaling-the-jenkins-architecture
translatedFrom: 76c0fc6
aliases: ["/posts/2015-07-20-escalar-la-arquitectura-de-jenkins/"]
---

*All of this information comes from the CloudBees technical paper 'Jenkins Continuous Integration Cookbook', which I translated into Spanish for this post.*

# Introduction
When an organization matures in continuous delivery, the requirements of its Jenkins installation grow in a similar way. That growth often shows up in the architecture of the master node, and it can be 'vertical' or 'horizontal'.

- **Vertical growth**: the load on a master goes up because you configure more jobs or orchestrate builds more often. It can also mean that more teams depend on that master.

- **Horizontal growth**: you create more masters in the organization to accommodate new teams or projects, instead of adding them to a single existing master.

There are potential pitfalls with each approach to scaling Jenkins, but with careful planning many of them can be managed or even avoided. Here are a few things to consider when you choose a strategy for scaling Jenkins instances in your organization.

- **Do you have the resources to run a distributed build system?** If possible, set up build nodes that run separately from the master. This frees up resources on the master, so it schedules jobs better, and it prevents builds from modifying sensitive data in the $JENKINS_HOME directory. With this approach a master scales vertically better than if it had to run and schedule builds at the same time.

- **Do you have the resources to maintain several masters?** Jenkins masters need periodic plugin updates, core updates twice a month, and backups of the configuration and the build history of the jobs. Security settings and roles have to be configured manually on each master. Also, when one of these masters goes down, you have to restart it by hand, along with the jobs that were canceled by the failure.

- **Are each team's projects critical?** Consider moving the vital projects to separate masters, to minimize the impact when one of them goes down. It is also worth converting the pipelines of critical projects to Workflow jobs, which can survive interruptions in the connection between masters and slaves.

- **How important is the startup time of your Jenkins instance?** The more jobs a master has configured, the longer Jenkins takes to load after an upgrade or a failure. On the other hand, using folders or views to organize the jobs can limit the number of jobs rendered during startup.

# Distributed Builds Architecture
A master can work on its own, handling both the build environment and the execution of jobs with its own executors and resources. If you start with this *"standalone"* setup, you will run out of resources as the number or the load of your projects grows.

To keep an infrastructure up and running like this, you will need to upgrade the master (more memory, more CPUs, and so on). While the physical machine is being maintained and upgraded, the master and all the build nodes are down, jobs are stopped and the whole Jenkins infrastructure is unusable.

Scaling Jenkins in this scenario is extremely painful. It introduces many waiting periods in which none of the resources assigned to the build environment can be used.

Running jobs on the master's executors also creates a security problem. The *jenkins* user that Jenkins uses to run jobs would have all permissions over all the Jenkins resources on the master. That means a malicious user, with a simple script, can get direct access to private information, and its integrity and privacy can no longer be guaranteed.

For all these reasons, Jenkins supports the "master/slave" mode, where the whole workload of the projects being built is delegated to multiple slave nodes.

{{< figure src="/images/master-slave-architecture.png" alt="Master/Slave architecture" >}}

A slave is a machine set up to take workload off the master. How builds are scheduled depends on the configuration of each project. Some can be set to use a specific slave node, while others can freely pick the slaves to run on from the pool of slaves assigned to the master.

In a distributed builds environment, the Jenkins master uses its resources only to handle HTTP requests and to manage the build environment. The actual execution of jobs is delegated to the slaves. With this setup you can scale the architecture horizontally, which lets a single Jenkins installation host a large number of projects and build environments.

## Master/Slave Communication Protocols
For a machine to be recognized as a slave, it needs to run a specific agent program that sets up two-way communication with the master.

There are several ways to establish this connection:

- **SSH connector**: configuring a slave to use the SSH connector is the preferred and most stable way to connect master and slave. Jenkins includes an SSH client implementation, which means the master can easily talk to any machine with an SSHD server installed. The only requirement is that the master's public key is part of the slave's set of authorized keys. Once you define the host machine and the SSH key to use (on the configuration page Manage Nodes > New Node), Jenkins handles the communication automatically: it installs the agent program binaries, and it stops and starts the slave program as needed.

- **JNLP-TCP connector**: here the connection is established by starting the slave agent through JNLP (Java Web Start). With this connector, the Java Web Start program has to be launched on the slave machine in one of 2 ways:
  - Manually, by browsing to the master's URL in a browser on the slave. Once you click the Java Web Start icon, the slave agent runs on the slave machine. The downside is that the master cannot manage the slave nodes centrally. With Jenkins versions older than 1.611, every start/stop/update cycle of the slave agent has to be run by hand on the slave machines. This approach is convenient when the master cannot open a connection to the client (for example, across a firewall).
  - As a service, which allows automatic restarts. First you have to launch the slave manually, with the method above. After that, *jenkins-slave.exe* and *jenkins-slave.xml* are created in the working directory of the slave node. Then you need to run the following on the command line, where **<serviceKey>** is the name of the registry key that defines the service and **<service display name>** is the label that identifies the service in the Windows Services management interface. To make sure restarts are automatic, you have to download a slave JAR newer than version v2.37 and copy it to a permanent path on the slave machine. You can download this *slave.jar* from **http://<your-jenkins-host>/jnlpJars/slave.jar**. If you use a Jenkins version newer than 1.559, *slave.jar* is kept up to date every time the slave connects to the master.

{{< highlight bash >}}
sc.exe create "<serviceKey>" start= auto binPath= "<Ruta al jenkins-slave.exe>" DisplayName=
{{< /highlight >}}

- **JNLP-HTTP connector**: this approach is very similar to JNLP-TCP, with one difference: the slave agent runs in *headless* mode and the connection can be tunneled over HTTP(S). It is convenient for running as a daemon on Unix machines.

- **Custom script**: if the previous options are not flexible enough for a very specific use case, you can also write your own script to start the communication between master and slave. The only requirement is that the script runs the Java program `java -jar slave.jar` on the slave.

Windows slaves can use either the standard SSH approach or JNLP, or a more Windows-specific one. Windows slave nodes have the following options:

- SSH connector with PuTTY
- SSH connector with Cygwin and OpenSSH, which is the easiest and the recommended one. [SSH slaves and Cygwin](http://wiki.jenkins-ci.org/display/JENKINS/SSH+slaves+and+Cygwin)
- Remote management facilities (WMI + DCOM): with this approach, which uses a specific plugin ([Windows Slaves Plugin](http://wiki.jenkins-ci.org/display/JENKINS/Windows+Slaves+Plugin)), the master registers the slave agent on the slave machine by creating a Windows service. The master can then control the slaves, including stopping, restarting and updating them. However, this approach is hard to set up and is not recommended.
- JNLP connector: with this approach ([Installing Jenkins as a Windows service](http://wiki.jenkins-ci.org/display/JENKINS/Installing+Jenkins+as+a+Windows+service)) you can register the slave manually as a Windows service, but you cannot manage it centrally from the master. Every stop/start/update of the slave agent has to be run by hand on the slave machine, unless you are using Jenkins 1.611 or later.

# Creating Fungible Slaves

## Configuring Tools on Slaves
The Global configuration page of Jenkins lets you specify the tools needed while jobs run: Ant, Maven, Java, and so on.

When you define a tool, you can point to an existing installation by giving the directory where the program is expected to be on the slave machine. Another option is to let Jenkins take care of installing a specific version at the path you indicate. You can also specify more than one installation of the same tool, since different jobs may need different versions of it.

The predefined option, *Default*, invokes the tool that is already configured on the slave and exists in the system *PATH* variable of the machine. This always fails if the tool is not installed or has not been added to the *PATH*.

> A good practice to avoid this failure is to configure a job assuming that the target slave does not have the required tools installed, and to include their installation as part of the job's execution.

## Defining a Policy for Sharing Slave Machines

As mentioned earlier, slave machines should be completely interchangeable and standardized, so they can be shared and resource use is optimized. For that reason, slave nodes should not be customized for a particular set of jobs or for a particular team. CloudBees recommends always making slaves general enough to be shared across jobs and teams, although there are some exceptions.

Lately Jenkins has become more and more popular, not only for Continuous Integration but also for Continuous Delivery. That means it has to orchestrate jobs and pipelines that involve different teams with different technical profiles: developers, QA engineers, DevOps, and so on.

In that scenario it can make sense to create dedicated or customized slaves. Different teams may need different tools (e.g. Puppet/Chef for teams related to Operations). You can even store the credentials of those teams on their slave node, so that their protection and privacy are ensured.

To make sure a job runs on a single slave node, or even on a single set of nodes (e.g. iOS projects that only build on OSX slaves), you can pin the job to the slave by specifying the slave's label on the job's configuration page. You have to repeat this pinning for every job, and it does not stop other jobs or teams from using that slave.

## Configuring Cloud Slave Nodes
Using build nodes in the cloud can be a solution when you want to keep a reasonably small local cluster of slave nodes and still give jobs new resources when they need them.

In particular, you can offload jobs by moving them to cloud slaves, thanks to specific plugins that handle creating those cloud resources and destroying them when they are no longer needed:

- The [EC2 plugin](https://wiki.jenkins-ci.org/display/JENKINS/Amazon+EC2+Plugin) lets Jenkins use AWS EC2 instances as cloud resources when it runs out of local nodes. EC2 nodes are created dynamically inside an AWS network and are removed when they are no longer needed.

- The [JClouds plugin](https://wiki.jenkins-ci.org/display/JENKINS/JClouds+Plugin) adds the ability to run jobs on any cloud provider supported by the JClouds libraries.

- The [CloudBees Cloud Connector plugin](https://wiki.jenkins-ci.org/display/JENKINS/CloudBees+Cloud+Connector+Plugin) makes it possible to use a subscription to the CloudBees Jenkins service, DEV@cloud, to extend the build capacity of a local Jenkins installation. The plugin lets instances send some jobs to the cluster managed by CloudBees, which are Linux slave nodes running on the DEV@cloud service.

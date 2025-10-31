---
title: "From Hours to Minutes: How Dotfiles Changed My Laptop Migration Strategy"
date: 2025-10-28 09:00:00 +0100
description: "Transform laptop migration from a multi-day ordeal into a 25-minute automated process. A practical guide to treating your development environment as code."
image: "/images/posts/2025-10-28-dotfiles/cover.png"
categories: [Development, DevOps, Productivity]
tags: ["dotfiles", "automation", "macos", "productivity", "devops", "shell", "homebrew"]
type: post
weight: 28
showTableOfContents: true
---

![Laptop migration with dotfiles automation](/images/posts/2025-10-28-dotfiles/cover.png)

## The Problem: The Dreaded Laptop Switch

We've all been there. You get a shiny new MacBook, and instead of diving into work, you spend the next day (or week) trying to remember:

- Which Homebrew packages did I have installed?
- What were my bash/zsh aliases again?
- How did I configure my Git settings?
- Where are my SSH keys?
- What VSCode extensions was I using?
- Which version of Node, Go, Java, and Python do I need?

The traditional approach involves a mix of:
1. Manually copying files between machines
2. Googling "how to export VSCode extensions"
3. Taking screenshots of settings panels
4. Asking colleagues "what did I use for X again?"
5. Inevitably forgetting something critical and discovering it weeks later

**The result?** Lost productivity, frustration, and the nagging feeling you're not quite as efficient as you were on your old machine.

## The Solution: Dotfiles as Code

Dotfiles are configuration files in Unix-like systems (files that start with a dot, like `.bashrc`, `.gitconfig`, `.zshrc`). By treating your development environment as code (versioned, documented, and reproducible), you can transform laptop migration from a multi-day ordeal into a sub-30-minute automated process.

Here's how I solved this problem for myself, and how you can too.

## My Setup: What Gets Automated

My dotfiles repository manages everything for a complete development environment. The shell configuration includes custom aliases (like `g` for git, `k` for kubectl), navigation shortcuts, and smart version management for Python, Node, and Go. Shell history gets preserved, so that perfect command you ran three months ago is never lost.

Through Homebrew, I automate the installation of CLI tools: languages like Go, Python, Node.js, Java, Rust, and Ruby; cloud tools including AWS CLI, Google Cloud SDK, Azure CLI, and Terraform; container tools like Docker, Kubernetes, Helm, and Skaffold; plus databases, Git utilities, and many more tools I've accumulated over the years. GUI applications get the same treatment: browsers, VSCode with extensions pre-installed, productivity tools, and utilities like Rectangle and iTerm2.

Version managers (GVM for Go, SDKMAN for Java, NVM for Node.js, pyenv for Python) install automatically. Security essentials like SSH keys, GPG keys for signed commits, AWS credentials, and Kubernetes configurations all get restored. Even personal data (documents, pictures, source code repositories, and private configs) transfers seamlessly.

## The Three-Command Laptop Migration

When it's time to switch laptops, here's my entire process:

### On the Old Mac (20-25 minutes):
```bash
# Backup everything to NAS or another machine
backup-mac nas:/volume1/backups/laptop
```

This single command:
- Tests SSH connectivity
- Sets up passwordless authentication if needed
- Backs up all critical files with progress display
- Excludes junk (node_modules, logs, caches)
- Uses compression and keepalive to handle large transfers

### On the New Mac (20-25 minutes):
```bash
# Step 1: Get the dotfiles (1 minute)
git clone https://github.com/mdelapenya/dotfiles.git ~/.dotfiles
cd ~/.dotfiles

# Step 2: Restore from backup (10-15 minutes)
restore-mac nas:/volume1/backups/laptop

# Step 3: Install everything (10 minutes)
./install.sh
```

Done. Seriously.

The `install.sh` script:
1. Installs Homebrew (if needed)
2. Symlinks all dotfiles to your home directory
3. Installs CLI tools from a curated list
4. Installs GUI applications
5. Sets up version managers (GVM, SDKMAN)
6. Installs VSCode extensions

When you open your terminal on the new machine, all your aliases work. When you run `git commit`, your GPG signature is there. When you SSH to a server, your keys are ready. **It feels like home immediately.**

## How It's Built

The whole system is built around a simple idea: instead of documenting step-by-step instructions, I maintain declarative lists. Want to add a new tool? Append it to `scripts/formulas.txt` and re-run the installer. The approach scales beautifully. I've added many tools over time without the setup getting more complex.

One challenge was keeping public configuration separate from private data. My dotfiles repository is public on GitHub, but API keys and work-specific settings need to stay private. I solved this with files like `.extra` and `.company` that are gitignored but still get backed up. They're automatically sourced when they exist, so the dotfiles work identically whether you're using the public defaults or your private overrides.

The scripts are also designed to be re-run safely. Symlinks mean that when I update a dotfile in the repo, it's immediately active everywhere. The restore script asks before overwriting existing files. Nothing destructive happens without confirmation, though you can skip the prompts with a `-f` flag if you're confident.

I learned the hard way that macOS ships with rsync 2.6.9 from 2006. Installing the modern version via Homebrew gets you features like better progress reporting and improved handling of large transfers. The restore script now documents this and uses modern rsync features when available, with fallbacks for older versions.

## What Changed

The most obvious improvement is time. What used to take hours spread over several days now takes minutes. But the real wins go deeper than that.

Every machine I work on is now identical. When something works on my laptop, it works everywhere. The "it works on my machine" excuse doesn't exist anymore because I can recreate my machine anywhere in under half an hour.

I also stopped forgetting things. Before dotfiles, I'd spend time searching Slack history for "how did I configure GPG signing again?" Now it's in `./scripts/setup-gpg.sh`. Which kubectl plugins do I actually use? They're right there in `formulas.txt`. My dotfiles became executable documentation of my entire setup.

This setup also removed the fear of experimentation. Want to try a new terminal multiplexer? Install it, add it to your package list, commit. Hate it? Remove it from the list. The repository becomes a curated history of your evolving preferences, and you can always roll back.

When a new developer joins the team, the old approach meant pointing them to a 50-page wiki that was inevitably out of date. Now they fork the repo, customize the Git config with their name and email, run the installer, and they're working with a battle-tested environment in minutes.

## What I Learned Along the Way

This didn't happen overnight. I started with basic bash aliases and grew the system over time. Every time I caught myself manually configuring something, I asked: "Could this be automated?" The answer was almost always yes.

The first time I restored to a new machine, I discovered I'd forgotten to back up my `.kube` directory. Now I test the backup and restore process periodically, especially after adding new directories to the backup list. Better to find gaps during a test than during an actual migration.

NAS devices have their quirks too. Mine required enabling "SSH public key authentication" in the web UI, which wasn't obvious. I spent an hour troubleshooting before finding the setting. Now it's documented in the README, saving future-me (and anyone else) from that same rabbit hole.

Git history has become a fascinating record of how my preferences evolved. I can see exactly when I added Kubernetes tools, when I switched from Bash to Zsh, when I adopted GPG signing for commits. It's like a technical diary of my development environment over the years.

## Fork and Customize

My dotfiles are open source: [github.com/mdelapenya/dotfiles](https://github.com/mdelapenya/dotfiles)

To use them as a starting point:

1. **Fork the repository**
2. **Customize these files:**
   - `git/.gitconfig` - Your name, email, GPG key
   - `scripts/formulas.txt` - Add/remove packages
   - `scripts/cask.txt` - Add/remove GUI apps
   - `scripts/backup-mac.sh` - Adjust the BACKUP_ITEMS array
3. **Run the installer:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dotfiles.git ~/.dotfiles
   cd ~/.dotfiles
   ./install.sh
   ```

## The Bigger Picture

Dotfiles are about more than convenience. They're about:

- **Reproducibility:** Science requires reproducible experiments. So does software engineering.
- **Documentation:** Your dotfiles are executable documentation of your setup.
- **Continuity:** Your muscle memory works across machines.
- **Confidence:** Try new tools without fear. Your curated environment is always one `git clone` away.

## Conclusion

The next time you get a new laptop (whether for a new job, an upgrade, or because your old one decided to meet a cup of coffee), you'll be productive in minutes, not days.

Your future self will thank you. Your current self should start today.

---

**P.S.** Got questions about dotfiles? Want to share your setup? I'm [@mdelapenya](https://github.com/mdelapenya) on GitHub. Let's learn from each other's configurations.

**P.P.S.** Special thanks to the open-source dotfiles community, specially to Víctor Martínez (@v1v), to his amazing dotfiles repository [dotfiles-linux](https://github.com/v1v/dotfiles). This setup evolved from ideas borrowed from his repository. That's the beauty of open configuration: we all level up together.

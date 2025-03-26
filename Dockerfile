FROM ubuntu:latest

ARG HUGO_VERSION

# Install required packages
RUN apt-get update && apt-get install -y \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Hugo
RUN wget -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && dpkg -i /tmp/hugo.deb \
    && rm /tmp/hugo.deb

# Set working directory
WORKDIR /src

# Expose default Hugo port
EXPOSE 1313

# Set default command
CMD ["hugo", "server"]

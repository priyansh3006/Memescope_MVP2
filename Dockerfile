# Use the official Golang image as the base
FROM golang:1.21-alpine

# Set the working directory inside the container
WORKDIR /app

# Install Pulumi CLI (needed to run Pulumi commands)
RUN apk add --no-cache bash curl \
    && curl -fsSL https://get.pulumi.com | bash \
    && mv ~/.pulumi/bin/pulumi /usr/local/bin/

# Copy go.mod and go.sum to download dependencies
COPY go.mod go.sum ./

# Download dependencies
RUN go mod tidy

# Copy the entire project into the container
COPY . .

# Build the Pulumi project (this ensures the Go code compiles properly)
RUN go build -o pulumi-main

# Set the entrypoint to Pulumi
CMD ["pulumi", "up"]

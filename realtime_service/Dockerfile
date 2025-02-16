# First Stage: Build the Go Binary
FROM golang:1.22 AS builder

# Set the working directory inside the container
WORKDIR /trial

# Copy go module files first for dependency caching
COPY go.mod go.sum ./

# Download dependencies before copying the full source code
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Ensure cross-compilation for Linux architecture
RUN GOOS=linux GOARCH=amd64 go build -o /trial/bin/app ./main.go

# Second Stage: Use a minimal Alpine Linux image to run the application
FROM alpine:latest

WORKDIR /trial

# Install necessary dependencies (if needed)
RUN apk --no-cache add ca-certificates

# Copy the built binary from the builder stage
COPY --from=builder /trial/bin/app /trial/bin/app

# Ensure execution permissions
RUN chmod +x /trial/bin/app

# Expose the WebSocket service port
EXPOSE 8080

# Run the application
ENTRYPOINT ["/trial/bin/app"]

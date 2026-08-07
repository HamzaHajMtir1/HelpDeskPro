# Use Eclipse Temurin JDK 17 (Debian-based)
FROM eclipse-temurin:17-jdk

# Set default environment variable (can be overridden at build time)
ARG ENV=prod

# Install user/group utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy application JAR, environment-specific config, and logback.xml
COPY target/helpdesk-1.0.0.jar /app/app.jar
COPY src/main/resources/application-${ENV}.properties /app/application.properties

# Set the entrypoint
ENTRYPOINT ["java", "-jar", "/app/app.jar"]


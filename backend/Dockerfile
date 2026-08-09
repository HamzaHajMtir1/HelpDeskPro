# syntax=docker/dockerfile:1
#
# HelpDeskPro — Spring Boot backend
# Multi-stage: build the fat JAR with Maven, run it on a slim JRE.

# ---------------------------------------------------------------------------
# Stage 1 — build
# ---------------------------------------------------------------------------
# Maven 3.9.12 matches .mvn/wrapper/maven-wrapper.properties;
# Temurin 17 matches <java.version>17</java.version> in pom.xml.
FROM maven:3.9.12-eclipse-temurin-17 AS build

WORKDIR /build

COPY pom.xml ./
COPY src ./src

# Tests are executed by the CI workflow (they need a database), not here.
# The BuildKit cache mount keeps ~/.m2 warm across builds without baking it
# into an image layer.
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -DskipTests clean package

# ---------------------------------------------------------------------------
# Stage 2 — runtime (JRE only: no Maven, no JDK, no sources)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runtime

RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# spring-boot-maven-plugin produces helpdesk-<version>.jar (the
# helpdesk-<version>.jar.original thin jar is not matched by *.jar).
COPY --from=build /build/target/helpdesk-*.jar /app/app.jar

# AttachmentService / KnowledgeController write to the relative path "uploads/".
RUN mkdir -p /app/uploads && chown -R spring:spring /app

USER spring

# All configuration (DB, JWT, SMTP, Groq) is supplied at runtime through
# environment variables — nothing sensitive is baked into the image.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

EXPOSE 8080

# spring-boot-starter-actuator is NOT a dependency of this project (verified in
# pom.xml) and adding it just for a probe is out of scope, so this is a TCP
# probe rather than an HTTP health endpoint. Tomcat binds the port at the end of
# startup, which makes port-open a reasonable readiness signal here.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=20 \
    CMD nc -z 127.0.0.1 8080 || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

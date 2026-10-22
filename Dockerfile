FROM node:22-alpine AS web
RUN apk add --no-cache openjdk17-jre-headless ffmpeg imagemagick
WORKDIR /src
COPY lainTSX/package.json lainTSX/package-lock.json ./
RUN npm ci
COPY lainTSX/ ./
RUN mkdir scripts/discs \
 && ln -s /disks/disk1.bin scripts/discs/disc1.bin \
 && ln -s /disks/disk2.bin scripts/discs/disc2.bin
COPY docker/web.sh /web.sh
CMD ["sh", "/web.sh"]

FROM eclipse-temurin:17-jdk AS apk
ENV ANDROID_HOME=/opt/android-sdk
RUN apt-get update && apt-get install -y --no-install-recommends unzip wget && rm -rf /var/lib/apt/lists/*
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/t.zip \
 && mkdir -p $ANDROID_HOME/cmdline-tools && unzip -q /tmp/t.zip -d $ANDROID_HOME/cmdline-tools \
 && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && rm /tmp/t.zip \
 && yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses >/dev/null \
 && $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-34" "build-tools;34.0.0" >/dev/null
RUN wget -q https://services.gradle.org/distributions/gradle-8.7-bin.zip -O /tmp/g.zip \
 && unzip -q /tmp/g.zip -d /opt && rm /tmp/g.zip
ENV PATH=/opt/gradle-8.7/bin:$PATH
WORKDIR /app
COPY app/ ./
COPY docker/apk.sh /apk.sh
CMD ["sh", "/apk.sh"]
RUN echo "lets all love lain"
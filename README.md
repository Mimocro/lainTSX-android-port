# lainTSX android port

Easy to build wrapper to run [lainTSX](https://github.com/ad044/lainTSX) on android.

## Build process

- clone this repo with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=url.https://github.com/.insteadOf GIT_CONFIG_VALUE_0=git@github.com: git clone --recursive https://github.com/Mimocro/lainTSX-android-port` (translations subrepo is ssh submodule instead of http)
- place the `disk1.bin` and `disk2.bin` of the original psx game into the `disks` folder
- run `docker compose up --build`
- `out/lainTSX.apk` will be built

## Why

[3d.laingame.net](https://3d.laingame.net/) has no overlay buttons, and another port can't correctly scale the screen on some devices. Also, no need for the internet.

Also do not share the apk or you will go into the jail

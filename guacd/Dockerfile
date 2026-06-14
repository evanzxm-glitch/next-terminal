FROM guacamole/guacd:1.4.0@sha256:f95b0c6457663f776198773cc21fec7b57d964a305b774f9be99e6c6274eba70

USER root

COPY guacd/fonts/Menlo-Regular.ttf /usr/share/fonts/truetype/next-terminal/
COPY guacd/fonts/SourceHanSansCN-Regular.otf /usr/share/fonts/truetype/next-terminal/

RUN fc-cache -f

USER guacd

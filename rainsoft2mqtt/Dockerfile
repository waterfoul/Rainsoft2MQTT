ARG BUILD_FROM
FROM $BUILD_FROM as base

ENV LANG C.UTF-8
ARG BUILD_VERSION

RUN apk add --no-cache nodejs-current && corepack enable
COPY app/ app/
WORKDIR app
RUN yarn install
ENTRYPOINT [ "yarn", "node", "index.js" ]
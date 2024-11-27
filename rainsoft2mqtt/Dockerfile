ARG BUILD_FROM
FROM $BUILD_FROM as base

ENV LANG C.UTF-8
ARG BUILD_VERSION

RUN apk add --no-cache nodejs && corepack enable
COPY app/package.json app/yarn.lock app/
WORKDIR app
RUN yarn install --immutable --immutable-cache
ENTRYPOINT [ "node", "index.js" ]
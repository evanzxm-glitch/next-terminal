FROM node:18-bullseye AS web-builder

ENV NODE_OPTIONS=--dns-result-order=ipv4first

WORKDIR /src/web

COPY web/package.json web/package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY web/ ./
RUN npm run build

FROM golang:1.20-bullseye AS go-builder

ARG TARGETARCH
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=web-builder /src/web/build ./server/resource/build

RUN CGO_ENABLED=0 GOOS=linux GOARCH="${TARGETARCH}" \
    go build -ldflags "-s -w" -o /out/next-terminal main.go

FROM alpine:3.20

ENV TZ=Asia/Shanghai

RUN apk add --no-cache tzdata

WORKDIR /usr/local/next-terminal

COPY --from=go-builder /out/next-terminal ./next-terminal
COPY LICENSE ./

EXPOSE 8080

ENTRYPOINT ["./next-terminal"]

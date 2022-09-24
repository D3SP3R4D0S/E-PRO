# Node lts 버전 지정
FROM node:lts
# 앱 디렉터리 생성
WORKDIR /usr/src/app
# 앱 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 소스 추가
COPY . .

EXPOSE 3000
CMD ["npm", "start"]


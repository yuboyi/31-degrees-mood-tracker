# 使用OpenJDK 17作为基础镜像
FROM openjdk:17-jdk-alpine

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# 下载依赖（利用Docker缓存）
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# 复制源代码
COPY src src

# 构建应用
RUN ./mvnw clean package -DskipTests

# 创建最终运行镜像
FROM openjdk:17-jre-alpine

WORKDIR /app

# 安装字体支持（用于图片处理）
RUN apk add --no-cache fontconfig ttf-dejavu

# 复制jar文件
COPY --from=0 /app/target/ai-platform-*.jar app.jar

# 创建非root用户
RUN addgroup -g 1000 appuser && adduser -u 1000 -G appuser -s /bin/sh -D appuser
USER appuser

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m -Dspring.profiles.active=prod"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
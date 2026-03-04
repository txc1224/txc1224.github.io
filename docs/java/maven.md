---
title: 'Maven'
order: 7
---

# Maven 构建工具

> Maven 是 Java 生态最主流的项目构建与依赖管理工具，理解生命周期、依赖机制和插件体系是高效开发的基础。

---

## 生命周期

Maven 有三套独立的生命周期，每套包含多个阶段，执行某阶段会自动执行该生命周期中之前的所有阶段。

| 生命周期    | 核心阶段                                                                      | 说明             |
| ----------- | ----------------------------------------------------------------------------- | ---------------- |
| **clean**   | `pre-clean` → `clean` → `post-clean`                                          | 清理 target 目录 |
| **default** | `validate` → `compile` → `test` → `package` → `verify` → `install` → `deploy` | 项目构建主流程   |
| **site**    | `pre-site` → `site` → `post-site` → `site-deploy`                             | 生成项目文档站点 |

```bash
mvn clean package          # 先清理再打包（最常用）
mvn clean install          # 清理 → 编译 → 测试 → 打包 → 安装到本地仓库
mvn clean deploy           # 完整流程，发布到远程仓库
mvn package -DskipTests    # 打包但跳过测试执行
mvn package -Dmaven.test.skip=true  # 跳过测试编译和执行
```

---

## pom.xml 核心配置速查

```xml
<project>
  <groupId>com.example</groupId>        <!-- 组织标识 -->
  <artifactId>my-app</artifactId>       <!-- 项目名称 -->
  <version>1.0.0-SNAPSHOT</version>     <!-- 版本号 -->
  <packaging>jar</packaging>            <!-- 打包方式：jar/war/pom -->

  <properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.0</spring-boot.version>
  </properties>

  <!-- 依赖管理：统一版本号，子模块无需指定 version -->
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring-boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <!-- 实际依赖声明 -->
  </dependencies>
</project>
```

---

## 依赖 scope 对比

| scope      | 编译 | 测试 | 运行 | 打包 | 典型场景                             |
| ---------- | :--: | :--: | :--: | :--: | ------------------------------------ |
| `compile`  |  ✅  |  ✅  |  ✅  |  ✅  | 默认值，如 Spring Core               |
| `provided` |  ✅  |  ✅  |  ❌  |  ❌  | 容器提供，如 Servlet API             |
| `runtime`  |  ❌  |  ✅  |  ✅  |  ✅  | 运行时需要，如 MySQL 驱动            |
| `test`     |  ❌  |  ✅  |  ❌  |  ❌  | 仅测试，如 JUnit                     |
| `system`   |  ✅  |  ✅  |  ❌  |  ❌  | 本地 jar（不推荐使用）               |
| `import`   |  -   |  -   |  -   |  -   | 仅用于 dependencyManagement 导入 BOM |

---

## 依赖冲突排查

```bash
# 查看完整依赖树
mvn dependency:tree

# 查看某个依赖的引入路径
mvn dependency:tree -Dincludes=com.google.guava:guava

# 分析多余依赖和缺失声明
mvn dependency:analyze
```

```xml
<!-- 排除传递依赖 -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

**Maven 依赖调解规则：**

1. 路径最短优先（依赖层级越少越优先）
2. 路径相同时，先声明者优先

---

## Profiles 多环境配置

```xml
<profiles>
  <profile>
    <id>dev</id>
    <activation>
      <activeByDefault>true</activeByDefault>  <!-- 默认激活 -->
    </activation>
    <properties>
      <env>dev</env>
      <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
    </properties>
  </profile>
  <profile>
    <id>prod</id>
    <properties>
      <env>prod</env>
      <db.url>jdbc:mysql://prod-host:3306/prod_db</db.url>
    </properties>
  </profile>
</profiles>
```

```bash
mvn package -Pprod          # 激活 prod profile
mvn package -Pdev,staging   # 同时激活多个 profile
```

---

## 常用插件

| 插件                       | 用途                 | 关键配置                      |
| -------------------------- | -------------------- | ----------------------------- |
| `maven-compiler-plugin`    | 编译 Java 源码       | `source`、`target`、`release` |
| `maven-surefire-plugin`    | 运行单元测试         | `includes`、`excludes`        |
| `maven-shade-plugin`       | 打 fat jar（含依赖） | `transformers` 合并配置       |
| `spring-boot-maven-plugin` | Spring Boot 打包     | `repackage` 生成可执行 jar    |
| `maven-resources-plugin`   | 资源文件过滤         | `filtering=true` 替换占位符   |
| `maven-jar-plugin`         | 控制 jar 打包        | `mainClass` 指定入口类        |

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.11.0</version>
      <configuration>
        <release>17</release>    <!-- Java 17，推荐用 release 替代 source+target -->
      </configuration>
    </plugin>
  </plugins>
</build>
```

---

## 常见陷阱

```xml
<!-- ❌ 不在 dependencyManagement 中统一版本，导致子模块版本不一致 -->
<!-- 模块A 用 guava 31.0，模块B 用 guava 30.0，运行时冲突 -->

<!-- ✅ 在父 pom 的 dependencyManagement 统一管理版本 -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.guava</groupId>
      <artifactId>guava</artifactId>
      <version>32.1.3-jre</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

```xml
<!-- ❌ SNAPSHOT 版本上线，构建不可复现 -->
<version>1.0.0-SNAPSHOT</version>

<!-- ✅ 发布时使用正式版本号 -->
<version>1.0.0</version>
```

```bash
# ❌ 依赖冲突不排查，运行时 NoSuchMethodError / ClassNotFoundException
# ✅ 上线前跑一次 mvn dependency:tree 检查冲突
mvn dependency:tree | grep "omitted for conflict"
```

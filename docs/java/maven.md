# Maven

## 常用命令

```bash
mvn clean                   # 清理 target 目录
mvn compile                 # 编译源码
mvn test                    # 运行测试
mvn package                 # 打包（jar/war）
mvn install                 # 安装到本地仓库
mvn deploy                  # 发布到远程仓库

mvn dependency:tree         # 查看依赖树
mvn dependency:analyze      # 分析多余/缺失依赖
mvn versions:display-dependency-updates  # 查看可更新的依赖

# 跳过测试
mvn package -DskipTests

# 指定 profile
mvn package -Pprod

# 查看有效 pom
mvn help:effective-pom
```

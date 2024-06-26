FROM openjdk:11

# Установка необходимых инструментов
RUN apt-get update && apt-get install -y gnupg2 curl apt-transport-https

# Настройка репозитория sbt
RUN echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list
RUN echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee /etc/apt/sources.list.d/sbt_old.list
RUN curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x99E82A75642AC823" | apt-key add
RUN apt-get update && apt-get install -y sbt

WORKDIR /app

# Клонирование репозитория Lichess
RUN git clone https://github.com/ornicar/lila.git .
RUN sbt update

# Сборка проекта
RUN sbt app build

CMD ["./lila", "run"]

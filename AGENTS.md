# StyleHub B2B 성능 테스트 환경 — AI 작업 지침

패션 B2B 플랫폼 StyleHub를 개인적으로 fork해서 **로컬에서 k6 부하 테스트로 성능을 개선하는 환경**이다. 운영 서비스가 아니다.
배경과 진행 상황은 `README.md`, 코딩 규칙은 `docs/ground-rules.md`, ERD는 `docs/stylehub_b2b.dbml`을 본다.

## 1. 구성과 포트

| 구성 요소 | 실행 위치 | 주소 |
|---|---|---|
| Spring Boot 앱 (Java 17, Boot 3.5) | `backend/` (`./gradlew bootRun`) | `localhost:8080` |
| MySQL 8.0 | `docker-compose.local.yml` | `localhost:3308`, DB `stylehub` |
| Redis 7 | `docker-compose.local.yml` | `localhost:6380` |
| mysqld-exporter | `monitoring/docker-compose.monitoring.yml` | `localhost:9104` |
| Prometheus | 위와 같음 | `localhost:9090` |
| Grafana (익명 Viewer) | 위와 같음 | `127.0.0.1:3000` |
| 프론트엔드 (Vite) | `frontend/` | `localhost:5173` |

- 스프링 프로필: `local`(DB·Redis 접속), `loadtest`(SQL 로그 끔, 토스 결제 호출 스텁), `asynclog`(비동기 콘솔 로깅).
- 시드 데이터: 상품 100만, 옵션 300만, 주문 100만 건 수준. 루트의 `*.sql`은 부하 테스트용 보정 스크립트다.

## 2. 지표 (Prometheus)

수집 대상: `job="app"`(`/actuator/prometheus`, 5초), `job="mysql"`(mysqld-exporter, 5초).

| 보고 싶은 것 | PromQL |
|---|---|
| API p95 응답 시간 | `histogram_quantile(0.95, sum by (le) (rate(http_server_requests_seconds_bucket{uri="<URI>",method="<METHOD>"}[30s])))` |
| API 처리량 | `sum(rate(http_server_requests_seconds_count{uri="<URI>",method="<METHOD>"}[30s]))` |
| 에러 응답 | `sum by (status) (rate(http_server_requests_seconds_count{uri="<URI>",status=~"5.."}[30s]))` |
| 커넥션 풀 (최대 10) | `hikaricp_connections_active`, `hikaricp_connections_pending`, `hikaricp_connections_max` |
| 커넥션 획득 대기 | `rate(hikaricp_connections_acquire_seconds_sum[30s]) / rate(hikaricp_connections_acquire_seconds_count[30s])` |
| 주문 생성 단계별 시간 | `sum by (step) (rate(order_create_step_seconds_sum[30s])) / sum by (step) (rate(order_create_step_seconds_count[30s]))` |
| MySQL 슬로우 쿼리 | `increase(mysql_global_status_slow_queries[5m])` |
| MySQL 실행 중 쿼리, 행 락 대기 | `mysql_global_status_threads_running`, `rate(mysql_global_status_innodb_row_lock_waits[1m])` |
| MySQL 커밋, redo fsync | `rate(mysql_global_status_commands_total{command="commit"}[1m])`, `rate(mysql_global_status_innodb_os_log_fsyncs[1m])` |

- 주문 생성 단계(`step` 태그)는 `global/metrics/OrderStepTimer.java`로 측정한다: `0_service_total`, `1_user`, `2_cart`, `3_validate`, `4_stock`, `6_address`, `7a_order_insert`, `7b_items_build`, `7c_items_insert`, `8_log_insert`.
- Grafana 대시보드: `monitoring/grafana/dashboards/app-perf.json`(주문 생성 성능), `mysql.json`(MySQL).

## 3. DB 직접 조회 (읽기 전용)

`incident-analysis` 스킬의 `db_query.sh`는 아래 환경 변수로 접속한다. 비밀번호는 스크립트가 파일에서 직접 읽으므로 AI가 파일을 열 필요가 없다.

```bash
export INCIDENT_DB_CONTAINER=stylehub-perf-mysql
export INCIDENT_DB_CNF=monitoring/.my.cnf   # mysqld-exporter 계정 (읽기 전용 용도)
export INCIDENT_DB_NAME=stylehub
```

- exporter 계정 권한: `SELECT, PROCESS, REPLICATION CLIENT ON *.*` (확인됨). 조회·`EXPLAIN`·`performance_schema`는 되고, `sys` 스키마 뷰 일부는 권한 부족으로 실패한다.
- 실행 전에 Docker Desktop과 두 compose(`docker-compose.local.yml`, `monitoring/docker-compose.monitoring.yml`)가 떠 있어야 한다.

## 4. 로그

- 기본은 **콘솔 출력만** 있고 로그 수집 시스템은 없다.
- 분석용으로 실행할 때는 파일로 남긴다: `cd backend && sh gradlew bootRun --args='--spring.profiles.active=local,loadtest' > ../logs/app.log 2>&1` (`gradlew`에 실행 권한이 없어서 `sh`로 실행한다. `logs/`는 gitignore 대상이다)
- `RequestIdFilter`가 요청마다 `METHOD URI STATUS 123ms` 한 줄을 남긴다. MDC 키는 `traceId`, 응답 헤더는 `X-Request-Id`.
- `local` 프로필은 Hibernate SQL을 DEBUG로 출력한다. 부하 테스트할 때는 `loadtest` 프로필로 끈다.
- JVM 크래시 기록(`backend/hs_err_pid*.log`, `*.jfr`)이 남아 있을 수 있다.

## 5. 알림

- Grafana 알림 규칙 `monitoring/grafana/provisioning/alerting/slow-query.yml`: 최근 5분 동안 슬로우 쿼리가 늘면 Slack(`SLACK_WEBHOOK_URL`)으로 보낸다.
- MySQL은 `slow_query_log=ON`, `long_query_time=1`초로 설정되어 있다(확인됨). 이 설정은 레포가 아니라 MySQL 서버에 직접 적용되어 있다.

## 6. 부하 테스트 (k6)

- 스크립트는 `k6/`에 있고, 새 시나리오는 `.claude/skills/k6-scenario-generator`를 따른다.
- 목표: 협의 목록 조회 p95 300ms, 주문 생성(`POST /api/buyer/orders`) p95 800ms, 결제 confirm(`POST /api/v1/payments/confirm`) p95 1500ms. 에러율은 모두 1% 미만.
- 테스트 계정: `loadtest{N}@stylehub-test.com`.
- 이미 알려진 원인: WSL2 소켓 I/O 지연(인프라 한계라 보류), 재고 미차감으로 인한 오버셀(원자적 UPDATE로 해결), 콜드 스타트.

## 7. 규칙

- **분석할 때는 읽기만 한다.** DB에 쓰기·DDL을 하지 않고, 컨테이너나 앱을 재시작하지 않는다. 필요하면 사람에게 먼저 묻는다.
- 비밀값 파일은 열지 않는다: `.env`, `monitoring/.env`, `monitoring/.my.cnf`, `backend/src/main/resources/application-local.yaml`. 접속 정보가 필요하면 사람에게 묻는다.
- 커밋 메시지와 PR은 `.claude/skills/commit-pr-writer`의 스타일(한글, Conventional Commits)을 따른다.

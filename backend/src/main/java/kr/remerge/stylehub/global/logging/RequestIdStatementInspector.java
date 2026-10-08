package kr.remerge.stylehub.global.logging;

import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.slf4j.MDC;

import static kr.remerge.stylehub.global.logging.RequestIdFilter.MDC_KEY;

public class RequestIdStatementInspector implements StatementInspector {

    @Override
    public String inspect(String sql) {

        String id = MDC.get(MDC_KEY);

        if (id == null || id.isBlank()) {
            return sql;
        }

        return "/* traceId=" + id + " */ " + sql;
    }
}

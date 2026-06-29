package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderLogService {

    private final OrderLogRepository orderLogRepository;




}

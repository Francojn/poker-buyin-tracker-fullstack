package com.newton.backend.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentLinkRequest {

    @URL(message = "Invalid URL format")
    private String paymentLink;
}

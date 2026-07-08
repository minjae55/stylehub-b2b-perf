package kr.remerge.stylehub.global.auth;

import kr.remerge.stylehub.global.auth.jwt.JwtAuthenticationEntryPoint;
import kr.remerge.stylehub.global.auth.jwt.JwtFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/ws/**",
            "/api/login/**",
            "/oauth2/**",
            "/error",
            "/favicon.ico",

            // 회원가입
            "/api/upload/image",
            "/api/company/ocr",
            "/api/company/verify",
            "/api/company/lookup",
            "/api/users/signup/buyer",
            "/api/users/signup/seller",
            "/api/users/signup/employee",
            "/api/categories/main"
    };

    private final JwtFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

//                .oauth2Login(oauth2 -> oauth2
//                        .authorizationEndpoint(endpoint ->
//                                endpoint.authorizationRequestRepository(authorizationRequestRepository))
//                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
//                        .successHandler(oAuth2SuccessHandler
//                        )
//                        .failureHandler((request, response, exception) -> {
//                            exception.printStackTrace();
//                        })
//                )

                .exceptionHandling(ex -> ex
                                .authenticationEntryPoint(entryPoint)
//                        .defaultAuthenticationEntryPointFor(
//                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
//                                (RequestMatcher) request -> request.getRequestURI().startsWith("/login/oauth2/")
//                        )
                )

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

//    @Bean
//    public HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository() {
//        return new HttpCookieOAuth2AuthorizationRequestRepository();
//    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
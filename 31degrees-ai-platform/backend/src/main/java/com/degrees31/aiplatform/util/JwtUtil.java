package com.degrees31.aiplatform.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.header}")
    private String header;

    @Value("${jwt.prefix}")
    private String prefix;

    /**
     * 生成JWT令牌
     * 
     * @param userId 用户ID
     * @param openid 微信openid
     * @return JWT令牌
     */
    public String generateToken(Long userId, String openid) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("openid", openid);
        claims.put("type", "access_token");
        return generateToken(claims);
    }

    /**
     * 生成JWT令牌
     * 
     * @param claims 声明信息
     * @return JWT令牌
     */
    public String generateToken(Map<String, Object> claims) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 从令牌中获取用户ID
     * 
     * @param token JWT令牌
     * @return 用户ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        if (claims == null) {
            return null;
        }
        Object userId = claims.get("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    /**
     * 从令牌中获取openid
     * 
     * @param token JWT令牌
     * @return openid
     */
    public String getOpenidFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? (String) claims.get("openid") : null;
    }

    /**
     * 从令牌中获取过期时间
     * 
     * @param token JWT令牌
     * @return 过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.getExpiration() : null;
    }

    /**
     * 验证令牌是否有效
     * 
     * @param token JWT令牌
     * @return 是否有效
     */
    public Boolean validateToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims != null && !isTokenExpired(token);
        } catch (Exception e) {
            log.warn("JWT令牌验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 检查令牌是否过期
     * 
     * @param token JWT令牌
     * @return 是否过期
     */
    public Boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromToken(token);
        return expiration != null && expiration.before(new Date());
    }

    /**
     * 刷新令牌
     * 
     * @param token 原令牌
     * @return 新令牌
     */
    public String refreshToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            if (claims == null) {
                return null;
            }
            claims.setIssuedAt(new Date());
            return generateToken(claims);
        } catch (Exception e) {
            log.warn("JWT令牌刷新失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从请求头中提取令牌
     * 
     * @param authHeader 认证头
     * @return JWT令牌
     */
    public String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith(prefix)) {
            return authHeader.substring(prefix.length());
        }
        return null;
    }

    /**
     * 从令牌中获取声明信息
     * 
     * @param token JWT令牌
     * @return 声明信息
     */
    private Claims getClaimsFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            log.warn("JWT令牌已过期: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            log.warn("不支持的JWT令牌: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.warn("无效的JWT令牌: {}", e.getMessage());
            throw e;
        } catch (SecurityException e) {
            log.warn("JWT签名验证失败: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("JWT令牌参数错误: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 获取签名密钥
     * 
     * @return 签名密钥
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 获取令牌过期时间（毫秒）
     * 
     * @return 过期时间
     */
    public Long getExpiration() {
        return expiration;
    }

    /**
     * 获取认证头名称
     * 
     * @return 认证头名称
     */
    public String getHeader() {
        return header;
    }

    /**
     * 获取令牌前缀
     * 
     * @return 令牌前缀
     */
    public String getPrefix() {
        return prefix;
    }
}
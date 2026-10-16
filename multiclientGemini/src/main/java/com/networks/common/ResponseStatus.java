package com.networks.common;

/**
 * Protocol status codes returned by the server to the client.
 */
public enum ResponseStatus {
    SUCCESS("SUCCESS"),
    ERROR("ERROR"),
    UNAUTHORIZED("UNAUTHORIZED"),
    LOCKED("LOCKED"),
    NOT_FOUND("NOT_FOUND");

    private final String code;

    ResponseStatus(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static ResponseStatus fromString(String text) {
        if (text == null) {
            return null;
        }
        for (ResponseStatus status : ResponseStatus.values()) {
            if (status.code.equalsIgnoreCase(text.trim())) {
                return status;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return code;
    }
}

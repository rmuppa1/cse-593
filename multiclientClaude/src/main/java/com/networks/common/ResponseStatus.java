package com.networks.common;

/** Status codes sent by the server as the first field of every response. */
public enum ResponseStatus {
    SUCCESS,
    ERROR,
    UNAUTHORIZED,
    LOCKED,
    NOT_FOUND
}

CREATE TABLE klanten (
    id                    UUID         NOT NULL PRIMARY KEY,
    naam                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    telefoon              VARCHAR(50),
    straat                VARCHAR(255),
    huisnummer            VARCHAR(20),
    gemeente              VARCHAR(255),
    postcode              VARCHAR(20),
    land                  VARCHAR(100),
    herkomst              VARCHAR(30)  NOT NULL,
    herkomst_toelichting  VARCHAR(500),
    voorkeur_contactwijze VARCHAR(30)  NOT NULL,
    is_geanonimiseerd     BOOLEAN      NOT NULL DEFAULT FALSE,
    aangemaakt_op         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE klant_allergenen (
    klant_id  UUID        NOT NULL REFERENCES klanten(id) ON DELETE CASCADE,
    allergeen VARCHAR(50) NOT NULL,
    PRIMARY KEY (klant_id, allergeen)
);

CREATE TABLE klant_speciale_eisen (
    id         UUID          NOT NULL PRIMARY KEY,
    klant_id   UUID          NOT NULL REFERENCES klanten(id) ON DELETE CASCADE,
    omschrijving VARCHAR(1000) NOT NULL
);

CREATE TABLE nevo_producten (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    naam        VARCHAR(500) NOT NULL,
    groep       VARCHAR(200),
    energie_kcal    DECIMAL(10,2),
    eiwitten_g      DECIMAL(10,2),
    koolhydraten_g  DECIMAL(10,2),
    suikers_g       DECIMAL(10,2),
    vet_g           DECIMAL(10,2),
    verzadigd_vet_g DECIMAL(10,2),
    vezels_g        DECIMAL(10,2),
    natrium_mg      DECIMAL(10,2)
);

CREATE INDEX idx_nevo_naam ON nevo_producten (naam);

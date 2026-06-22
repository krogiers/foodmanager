CREATE TABLE ingredienten (
    id            UUID         NOT NULL PRIMARY KEY,
    naam          VARCHAR(255) NOT NULL UNIQUE,
    eenheid       VARCHAR(10)  NOT NULL,
    aankoopprijs  NUMERIC(10, 4),
    energie_kcal  NUMERIC(8, 2),
    eiwitten_g    NUMERIC(8, 2),
    koolhydraten_g NUMERIC(8, 2),
    suikers_g     NUMERIC(8, 2),
    vetten_g      NUMERIC(8, 2),
    verzadigd_vet_g NUMERIC(8, 2),
    vezels_g      NUMERIC(8, 2),
    zout_g        NUMERIC(8, 2)
);

CREATE TABLE ingredient_allergenen (
    ingredient_id UUID        NOT NULL REFERENCES ingredienten(id) ON DELETE CASCADE,
    allergeen     VARCHAR(50) NOT NULL,
    aanwezigheid  VARCHAR(20) NOT NULL,
    PRIMARY KEY (ingredient_id, allergeen)
);

CREATE TABLE provider_instellingen (
    id               BIGINT       NOT NULL PRIMARY KEY,
    actieve_provider VARCHAR(100) NOT NULL DEFAULT 'OPEN_FOOD_FACTS'
);

INSERT INTO provider_instellingen (id, actieve_provider) VALUES (1, 'OPEN_FOOD_FACTS');

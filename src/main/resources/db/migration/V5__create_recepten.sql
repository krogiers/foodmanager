CREATE TABLE recepten (
    id UUID PRIMARY KEY,
    naam VARCHAR(255) UNIQUE NOT NULL,
    houdbaarheid_waarde INT NULL,
    houdbaarheid_eenheid VARCHAR(20) NULL
);

CREATE TABLE recept_regels (
    id UUID PRIMARY KEY,
    recept_id UUID NOT NULL REFERENCES recepten(id) ON DELETE CASCADE,
    hoeveelheid DECIMAL(10, 4) NOT NULL,
    eenheid VARCHAR(10) NOT NULL,
    ingredient_id UUID NULL REFERENCES ingredienten(id) ON DELETE RESTRICT,
    sub_recept_id UUID NULL REFERENCES recepten(id) ON DELETE RESTRICT,
    volgorde INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_recept_regel_component CHECK (
        (ingredient_id IS NOT NULL AND sub_recept_id IS NULL) OR
        (ingredient_id IS NULL AND sub_recept_id IS NOT NULL)
    )
);

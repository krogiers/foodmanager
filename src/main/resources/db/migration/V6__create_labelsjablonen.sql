CREATE TABLE labelsjablonen (
    id           UUID         PRIMARY KEY,
    naam         VARCHAR(255) NOT NULL UNIQUE,
    breedte_mm   INT          NOT NULL,
    hoogte_mm    INT          NOT NULL,
    html_template TEXT        NOT NULL
);

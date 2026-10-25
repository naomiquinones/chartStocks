CREATE TABLE stocks (
  symbol TEXT PRIMARY KEY
);

CREATE TABLE prices (
  symbol       TEXT    NOT NULL,
  trading_date DATE    NOT NULL,
  close        NUMERIC NOT NULL,
  PRIMARY KEY (symbol, trading_date)
);

CREATE TABLE price_cache_status (
  symbol          TEXT        PRIMARY KEY,
  last_checked_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE marketstack_calls (
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
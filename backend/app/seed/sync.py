def sync_exercises_from_source() -> None:
    """Future home for a daily online sync job that discovers new CrossFit
    exercises/WODs from an external source and merges them into the local
    database (the "search online daily" idea from CLAUDE.md).

    NOT IMPLEMENTED in this version - the app currently ships with a curated
    static seed set only (see seed/exercises.py, seed/fixed_wods.py). When
    this is built, it should:
      - fetch/parse from a chosen external source
      - de-duplicate against existing Exercise rows (by name/category)
      - insert new rows via the same session pattern as seeder.run_seed()
      - be triggered by a scheduler (e.g. a cron job or scheduled task
        calling a small CLI entrypoint), not by request handlers
    """
    raise NotImplementedError(
        "Online exercise sync is not implemented yet; see this function's docstring for the intended design."
    )

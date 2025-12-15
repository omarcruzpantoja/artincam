package filters

import (
	"net/url"
	"strconv"
	"time"
)

type ActionLogFilter struct {
	AgentID   *string    `schema:"agent_id"`
	Category  *string    `schema:"category"`
	StartDate *time.Time `schema:"start_date"`
	EndDate   *time.Time `schema:"end_date"`
	Limit     int64
	Offset    int64
}

func (f *ActionLogFilter) Parse(q url.Values) error {
	var err error

	if v := q.Get("agent_id"); v != "" {
		f.AgentID = &v
	}

	if v := q.Get("category"); v != "" {
		f.Category = &v
	}

	if v := q.Get("start_date"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return err
		}
		f.StartDate = &t
	}

	if v := q.Get("end_date"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return err
		}
		f.EndDate = &t
	}

	if v := q.Get("limit"); v != "" {
		f.Limit, err = strconv.ParseInt(v, 10, 64)

		if err != nil {
			return err
		}
	} else {
		f.Limit = 100 // default limit
	}

	if v := q.Get("offset"); v != "" {
		f.Offset, err = strconv.ParseInt(v, 10, 64)

		if err != nil {
			return err
		}
	} else {
		f.Offset = 0 // default offset
	}

	return nil
}

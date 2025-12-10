package filters

import (
	"net/url"
	"strconv"
)

type ActionLogFilter struct {
	AgentID  *string `schema:"agent_id"`
	Category *string `schema:"category"`
	Limit    int64
	Offset   int64
}

func (f *ActionLogFilter) Parse(q url.Values) error {
	var err error

	if v := q.Get("agent_id"); v != "" {
		f.AgentID = &v
	}

	if v := q.Get("category"); v != "" {
		f.Category = &v
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

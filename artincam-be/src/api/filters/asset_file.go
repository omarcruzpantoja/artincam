package filters

import (
	"net/url"
	"strconv"
)

type AssetFileFilter struct {
	AgentID   *string `schema:"agent_id"`
	Limit     int64
	Offset    int64
	SortField string
	SortOrder string
}

func (f *AssetFileFilter) Parse(q url.Values) error {
	var err error

	if v := q.Get("agent_id"); v != "" {
		f.AgentID = &v
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

	if v := q.Get("sort_field"); v != "" {
		f.SortField = v
	} else {
		f.SortField = "timestamp" // default sort field
	}

	if v := q.Get("sort_order"); v != "" {
		f.SortOrder = v
	} else {
		f.SortOrder = "asc" // default sort order
	}

	return nil
}

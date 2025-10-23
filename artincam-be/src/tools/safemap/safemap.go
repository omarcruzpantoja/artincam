package safemap

import "sync"

// SafeMap is a generic, concurrency-safe map.
type SafeMap[K comparable, V any] struct {
	mu sync.RWMutex
	m  map[K]V
}

// New creates and returns a new SafeMap instance.
func New[K comparable, V any]() *SafeMap[K, V] {
	return &SafeMap[K, V]{m: make(map[K]V)}
}

// Set adds or updates a key-value pair.
func (s *SafeMap[K, V]) Set(key K, value V) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[key] = value
}

// Get retrieves a value by key.
// It returns (value, true) if found, or (zeroValue, false) if not.
func (s *SafeMap[K, V]) Get(key K) (V, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	val, ok := s.m[key]
	return val, ok
}

// Delete removes a key (no-op if missing).
func (s *SafeMap[K, V]) Delete(key K) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.m, key)
}

// Keys returns a snapshot of all keys.
func (s *SafeMap[K, V]) Keys() []K {
	s.mu.RLock()
	defer s.mu.RUnlock()
	keys := make([]K, 0, len(s.m))
	for k := range s.m {
		keys = append(keys, k)
	}
	return keys
}

// Len returns the number of entries.
func (s *SafeMap[K, V]) Len() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.m)
}

// Clear removes all entries.
func (s *SafeMap[K, V]) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m = make(map[K]V)
}

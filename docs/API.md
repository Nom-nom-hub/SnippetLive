# API Documentation

## Local Storage API

### Snippet Structure
```javascript
{
  id: string,
  title: string,
  language: string,
  code: string,
  tags: string[],
  favorite: boolean,
  created: Date,
  modified: Date,
  version: number,
  versions: Array<{
    code: string,
    timestamp: Date,
    version: number
  }>
}
```

### Methods

#### Snippet Management

```javascript
// Add new snippet
function addSnippet(snippetData: SnippetData): void

// Update existing snippet
function updateSnippet(id: string, updates: Partial<SnippetData>): void

// Delete snippet
function deleteSnippet(id: string): void

// Get snippet by ID
function getSnippet(id: string): Snippet | null

// Get all snippets
function getAllSnippets(): Snippet[]
```

#### Version Control

```javascript
// Get version history
function getVersionHistory(snippetId: string): Version[]

// Restore version
function restoreVersion(snippetId: string, versionNumber: number): void

// Create new version
function createVersion(snippetId: string, code: string): void
```

#### Search & Filter

```javascript
// Search snippets
function searchSnippets(query: string): Snippet[]

// Filter by tags
function filterByTags(tags: string[]): Snippet[]

// Filter by language
function filterByLanguage(language: string): Snippet[]
```

## Events

### Available Events

```javascript
// Snippet events
'snippet:created'
'snippet:updated'
'snippet:deleted'
'snippet:restored'

// Version events
'version:created'
'version:restored'

// System events
'storage:cleared'
'backup:created'
'backup:restored'
```

### Event Usage

```javascript
// Subscribe to event
document.addEventListener('snippet:created', (event) => {
  const snippet = event.detail;
  // Handle new snippet
});

// Emit event
document.dispatchEvent(new CustomEvent('snippet:created', {
  detail: snippetData
}));
```

## Error Handling

```javascript
class SnippetError extends Error {
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Error codes
const ERROR_CODES = {
  STORAGE_FULL: 'E001',
  INVALID_DATA: 'E002',
  NOT_FOUND: 'E003',
  VERSION_ERROR: 'E004'
};
```
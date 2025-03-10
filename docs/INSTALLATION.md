# Installation Guide

## Quick Start

### Online Usage
1. Visit [Code Snippet Manager](https://nom-nom-hub.github.io/SnippetLive/)
2. Start using immediately - no installation required!

### Local Development Setup

#### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of HTML, CSS, and JavaScript
- Git (optional, for development)

#### Basic Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Nom-nom-hub/SnippetLive.git
   ```

2. Navigate to project directory:
   ```bash
   cd SnippetLive
   ```

3. Open `index.html` in your browser:
   - Double-click the file
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

#### Development Setup
1. Install recommended extensions:
   - Live Server
   - JavaScript (ES6) code snippets
   - Prettier - Code formatter

2. Configure your IDE:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

## Configuration

### Local Storage
The application uses browser's LocalStorage for data persistence. To clear data:
1. Open browser's Developer Tools
2. Navigate to Application > Storage > Local Storage
3. Clear as needed

### Theme Configuration
Modify `styles.css` to customize:
- Color schemes
- Font sizes
- Layout preferences

## Troubleshooting

### Common Issues

1. **Snippets Not Saving**
   - Check LocalStorage permissions
   - Ensure sufficient storage space
   - Clear browser cache

2. **Syntax Highlighting Not Working**
   - Verify PrismJS inclusion
   - Check language support files
   - Clear browser cache

3. **Performance Issues**
   - Reduce number of stored snippets
   - Clear old versions
   - Use pagination for large collections

### Support

Need help? Try these resources:
1. [GitHub Issues](https://github.com/Nom-nom-hub/SnippetLive/issues)
2. [Documentation](https://github.com/Nom-nom-hub/SnippetLive/docs)
3. [Community Discussions](https://github.com/Nom-nom-hub/SnippetLive/discussions)
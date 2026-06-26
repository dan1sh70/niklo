const fs = require('fs');
const path = require('path');

function replaceInFileSync(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir, replacements) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath, replacements);
            
            // Rename directory if needed
            let newDirName = file;
            for (const { regex, replacement } of replacements) {
                newDirName = newDirName.replace(regex, replacement);
            }
            if (newDirName !== file) {
                fs.renameSync(fullPath, path.join(dir, newDirName));
            }
        } else {
            // Only process text files (JS, TS, JSON, md)
            if (/\.(ts|js|json|md)$/.test(file)) {
                replaceInFileSync(fullPath, replacements);
            }
            
            // Rename file if needed
            let newFileName = file;
            for (const { regex, replacement } of replacements) {
                newFileName = newFileName.replace(regex, replacement);
            }
            if (newFileName !== file) {
                fs.renameSync(fullPath, path.join(dir, newFileName));
            }
        }
    }
}

// Setup adventure-service
processDirectory(path.join(__dirname, 'adventure-service'), [
    { regex: /package-service/g, replacement: 'adventure-service' },
    { regex: /package_service/g, replacement: 'adventure_service' },
    { regex: /PackageService/g, replacement: 'AdventureService' },
    { regex: /packages\.service/g, replacement: 'adventures.service' },
    { regex: /packages\.controller/g, replacement: 'adventures.controller' },
    { regex: /packages\.module/g, replacement: 'adventures.module' },
    { regex: /packages/g, replacement: 'adventures' },
    { regex: /package/g, replacement: 'adventure' },
    { regex: /Packages/g, replacement: 'Adventures' },
    { regex: /Package/g, replacement: 'Adventure' },
    { regex: /PACKAGE/g, replacement: 'ADVENTURE' },
]);

// Setup notification-service
processDirectory(path.join(__dirname, 'notification-service'), [
    { regex: /package-service/g, replacement: 'notification-service' },
    { regex: /package_service/g, replacement: 'notification_service' },
    { regex: /PackageService/g, replacement: 'NotificationService' },
    { regex: /packages\.service/g, replacement: 'notifications.service' },
    { regex: /packages\.controller/g, replacement: 'notifications.controller' },
    { regex: /packages\.module/g, replacement: 'notifications.module' },
    { regex: /packages/g, replacement: 'notifications' },
    { regex: /package/g, replacement: 'notification' },
    { regex: /Packages/g, replacement: 'Notifications' },
    { regex: /Package/g, replacement: 'Notification' },
    { regex: /PACKAGE/g, replacement: 'NOTIFICATION' },
]);

console.log('Refactoring complete.');

$ErrorActionPreference = "Stop"

$USERNAME = "dan1sh7"
$SERVICES = @(
    @{ Name = "nginx"; Context = "."; Dockerfile = "nginx.Dockerfile" },
    @{ Name = "auth-service"; Context = "./auth-service"; Dockerfile = "Dockerfile" },
    @{ Name = "bus-service"; Context = "./bus-service"; Dockerfile = "Dockerfile" },
    @{ Name = "payment-service"; Context = "./payment-service"; Dockerfile = "Dockerfile" },
    @{ Name = "hotel-service"; Context = "./hotel-service"; Dockerfile = "Dockerfile" },
    @{ Name = "user-service"; Context = "./user-service"; Dockerfile = "Dockerfile" },
    @{ Name = "ride-service"; Context = "./ride-service"; Dockerfile = "Dockerfile" },
    @{ Name = "driver-service"; Context = "./driver-service"; Dockerfile = "Dockerfile" },
    @{ Name = "package-service"; Context = "./package-service"; Dockerfile = "Dockerfile" },
    @{ Name = "adventure-service"; Context = "./adventure-service"; Dockerfile = "Dockerfile" },
    @{ Name = "notification-service"; Context = "./notification-service"; Dockerfile = "Dockerfile" },
    @{ Name = "admin-service"; Context = "./admin-service"; Dockerfile = "Dockerfile" },
    @{ Name = "booking-service"; Context = "./booking-service"; Dockerfile = "Dockerfile" },
    @{ Name = "postgres-db"; Context = "./postgres-db"; Dockerfile = "Dockerfile" }
)

Write-Host "Starting build and push process for $($SERVICES.Length) services..."

foreach ($service in $SERVICES) {
    $imageName = "$USERNAME/niklo-$($service.Name):latest"
    Write-Host "----------------------------------------"
    Write-Host "Building $imageName from context $($service.Context)..."
    
    if ($service.Context -eq ".") {
        docker build -t $imageName -f "$($service.Dockerfile)" $($service.Context)
    } else {
        docker build -t $imageName -f "$($service.Context)/$($service.Dockerfile)" $($service.Context)
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build $($service.Name)"
        exit 1
    }

    Write-Host "Pushing $imageName to Docker Hub..."
    docker push $imageName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push $($service.Name)"
        exit 1
    }
}

Write-Host "----------------------------------------"
Write-Host "All images successfully built and pushed!"

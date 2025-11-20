#!/bin/bash
# Database management script for Shanails project

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Seed the database
seed_db() {
    local container_name="${1:-shanails-backend-1}"
    
    print_info "Seeding database via container: $container_name"
    
    if ! docker ps | grep -q "$container_name"; then
        print_error "Container $container_name is not running"
        exit 1
    fi
    
    docker exec "$container_name" python seed.py
    print_info "Database seeded successfully!"
}

# Backup database
backup_db() {
    local db_container="${1:-shanails-db-1}"
    local backup_dir="./backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/shanails_backup_$timestamp.sql"
    
    mkdir -p "$backup_dir"
    
    print_info "Creating backup: $backup_file"
    docker exec "$db_container" pg_dump -U postgres shanails > "$backup_file"
    print_info "Backup created successfully!"
}

# Restore database
restore_db() {
    local backup_file="$1"
    local db_container="${2:-shanails-db-1}"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warn "This will restore the database from: $backup_file"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring database..."
    cat "$backup_file" | docker exec -i "$db_container" psql -U postgres shanails
    print_info "Database restored successfully!"
}

# Reset database (drop and recreate)
reset_db() {
    local db_container="${1:-shanails-db-1}"
    
    print_warn "This will DROP the entire database and recreate it!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Reset cancelled"
        exit 0
    fi
    
    print_info "Resetting database..."
    docker exec "$db_container" psql -U postgres -c "DROP DATABASE IF EXISTS shanails;"
    docker exec "$db_container" psql -U postgres -c "CREATE DATABASE shanails;"
    print_info "Database reset complete"
}

# Show database stats
show_stats() {
    local db_container="${1:-shanails-db-1}"
    
    print_info "Database Statistics:"
    echo ""
    docker exec "$db_container" psql -U postgres shanails -c "
        SELECT 
            'Masters' as table_name, COUNT(*) as count FROM master
        UNION ALL
        SELECT 'Services', COUNT(*) FROM service
        UNION ALL
        SELECT 'Users', COUNT(*) FROM \"user\"
        UNION ALL
        SELECT 'Appointments', COUNT(*) FROM appointment
        UNION ALL
        SELECT 'Schedules', COUNT(*) FROM schedule;
    "
}

# Main script
case "${1:-help}" in
    seed)
        check_docker
        seed_db "$2"
        ;;
    backup)
        check_docker
        backup_db "$2"
        ;;
    restore)
        if [ -z "$2" ]; then
            print_error "Please specify backup file: $0 restore <backup_file>"
            exit 1
        fi
        check_docker
        restore_db "$2" "$3"
        ;;
    reset)
        check_docker
        reset_db "$2"
        ;;
    stats)
        check_docker
        show_stats "$2"
        ;;
    *)
        echo "Shanails Database Management Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  seed [container]          Seed the database with sample data"
        echo "  backup [container]        Create a database backup"
        echo "  restore <file> [container] Restore database from backup"
        echo "  reset [container]         Drop and recreate the database"
        echo "  stats [container]         Show database statistics"
        echo ""
        echo "Examples:"
        echo "  $0 seed                   # Seed local test database"
        echo "  $0 backup                 # Backup database"
        echo "  $0 stats                  # Show database stats"
        ;;
esac

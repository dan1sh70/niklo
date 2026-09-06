import os
import re

partner_dir = "package-service/src/partner"

entities = {
    "bookings": ["package-booking", "package-booking-traveler", "package-booking-cancellation"],
    "earnings": ["package-settlement", "package-settlement-item", "package-withdrawal-request"],
    "home": [],
    "notifications": ["package-partner-notification", "partner-device-fcm-token"],
    "packages": ["package-departure", "package-itinerary-activity", "package-inclusion"],
    "profile": ["support-ticket", "support-ticket-message", "faq-article"],
}

entity_template = """import {{ Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn }} from 'typeorm';

@Entity('{table_name}')
export class {class_name} {{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}}
"""

def to_class_name(file_name):
    return "".join(word.capitalize() for word in file_name.split("-"))

def to_table_name(file_name):
    return file_name.replace("-", "_") + "s"

for module, module_entities in entities.items():
    entities_dir = os.path.join(partner_dir, module, "entities")
    os.makedirs(entities_dir, exist_ok=True)
    for entity in module_entities:
        class_name = to_class_name(entity)
        table_name = to_table_name(entity)
        file_path = os.path.join(entities_dir, f"{entity}.entity.ts")
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                f.write(entity_template.format(table_name=table_name, class_name=class_name))

# Clean up broken imports in modules and services
def clean_imports(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Generic replace of adventure-*.entity with package-booking, etc.
    content = re.sub(r"adventure-[a-zA-Z0-9-]+\.entity", "package-booking.entity", content)
    content = re.sub(r"PackageBankAccount", "PackageBooking", content)
    content = re.sub(r"PackageSettlement", "PackageBooking", content)
    content = re.sub(r"PackageEarningsWallet", "PackageBooking", content)
    content = re.sub(r"PackageNotificationPreferences", "PackageBooking", content)
    content = re.sub(r"PackageNotification", "PackageBooking", content)
    content = re.sub(r"PackageDeviceToken", "PackageBooking", content)
    content = re.sub(r"PackagePackageTier", "PackageBooking", content)
    content = re.sub(r"PackagePackageBenefit", "PackageBooking", content)
    content = re.sub(r"PackageComplianceDocument", "PackageBooking", content)

    with open(filepath, "w") as f:
        f.write(content)

for root, dirs, files in os.walk(partner_dir):
    for file in files:
        if file.endswith(".ts") and not file.endswith(".entity.ts"):
            clean_imports(os.path.join(root, file))


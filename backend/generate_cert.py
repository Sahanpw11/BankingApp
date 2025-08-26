#!/usr/bin/env python3
"""
SSL Certificate Generator for Banking App Demo
Generates self-signed certificates for HTTPS development
"""

import os
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime
import ipaddress

def generate_self_signed_cert():
    """Generate a self-signed certificate for localhost"""
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Create certificate subject
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"CA"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, u"San Francisco"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Banking App Demo"),
        x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
    ])
    
    # Create certificate
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # Certificate valid for 1 year
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(u"localhost"),
            x509.DNSName(u"127.0.0.1"),
            x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1")),
        ]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    # Create certificates directory if it doesn't exist
    cert_dir = os.path.join(os.path.dirname(__file__), 'certificates')
    os.makedirs(cert_dir, exist_ok=True)
    
    # Write private key
    key_path = os.path.join(cert_dir, 'server.key')
    with open(key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    # Write certificate
    cert_path = os.path.join(cert_dir, 'server.crt')
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    
    print(f"✅ SSL Certificate generated successfully!")
    print(f"📁 Certificate location: {cert_path}")
    print(f"🔑 Private key location: {key_path}")
    print(f"🌐 HTTPS will be available at: https://localhost:5443")
    
    return cert_path, key_path

if __name__ == "__main__":
    generate_self_signed_cert()

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface PropertyEmailProps {
  customerName: string;
  property: {
    title: string;
    price: number;
    location: string;
    propertyType: string;
    rooms?: string;
    area?: number;
    photos?: string[];
    description?: string;
  };
}

export default function PropertyEmail({ customerName, property }: PropertyEmailProps) {
  const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/properties/${property.title}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={heading}>Emlak Danışmanı</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Merhaba {customerName},</Text>
            <Text style={text}>Size uygun olabilecek bir mülk bulduk:</Text>
          </Section>

          {/* Property Card */}
          <Section style={propertyCard}>
            {/* Property Photo */}
            {property.photos && property.photos.length > 0 && (
              <Img
                src={property.photos[0]}
                alt={property.title}
                style={propertyImage}
              />
            )}

            {/* Property Title */}
            <Text style={propertyTitle}>{property.title}</Text>

            {/* Price */}
            <Text style={propertyPrice}>
              {property.price.toLocaleString('tr-TR')} TL
            </Text>

            {/* Property Details */}
            <Section style={propertyDetails}>
              <Text style={detailItem}>
                📍 {property.location}
              </Text>
              <Text style={detailItem}>
                🏠 {property.propertyType}
              </Text>
              {property.rooms && (
                <Text style={detailItem}>
                  🛏️ {property.rooms}
                </Text>
              )}
              {property.area && (
                <Text style={detailItem}>
                  📏 {property.area} m²
                </Text>
              )}
            </Section>

            {/* Description */}
            {property.description && (
              <Text style={description}>{property.description}</Text>
            )}

            {/* CTA Button */}
            <Button style={button} href={propertyUrl}>
              Mülkü İncele
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Bu e-posta size emlak danışmanınız tarafından gönderilmiştir.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
};

const section = {
  padding: '0 40px',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '8px 0',
};

const propertyCard = {
  margin: '32px 40px',
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
};

const propertyImage = {
  width: '100%',
  maxWidth: '560px',
  height: 'auto',
  borderRadius: '8px',
  marginBottom: '16px',
};

const propertyTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 12px 0',
};

const propertyPrice = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#16a34a',
  margin: '0 0 16px 0',
};

const propertyDetails = {
  margin: '16px 0',
};

const detailItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#525252',
  margin: '4px 0',
};

const description = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#737373',
  margin: '16px 0',
  whiteSpace: 'pre-wrap' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  marginTop: '24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  padding: '0 40px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#a3a3a3',
  textAlign: 'center' as const,
  margin: '0',
};

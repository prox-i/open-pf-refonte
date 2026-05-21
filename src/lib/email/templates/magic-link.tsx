import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  memberName: string
  magicUrl: string
  expiresInDays?: number
}

export function MagicLinkEmail({ memberName, magicUrl, expiresInDays = 30 }: MagicLinkEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Complétez la fiche de {memberName} sur OPEN PF</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={logoStyle}>OPEN PF</Heading>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>
              Complétez votre fiche adhérent
            </Heading>
            <Text style={textStyle}>Bonjour,</Text>
            <Text style={textStyle}>
              Votre demande d&apos;adhésion pour <strong>{memberName}</strong> a été reçue. Pour
              finaliser votre inscription et apparaître dans l&apos;annuaire des adhérents OPEN PF,
              veuillez compléter votre fiche en cliquant sur le bouton ci-dessous.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={magicUrl} style={buttonStyle}>
                Compléter ma fiche
              </Button>
            </Section>

            <Text style={smallTextStyle}>
              Ce lien est valable {expiresInDays} jours. Si vous avez des questions, contactez-nous
              à{' '}
              <a href="mailto:contact@open.pf" style={linkStyle}>
                contact@open.pf
              </a>
              .
            </Text>
            <Hr style={hrStyle} />
            <Text style={footerTextStyle}>
              Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous pouvez ignorer cet
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = { backgroundColor: '#f7f8fc', fontFamily: 'Inter, Arial, sans-serif' }
const containerStyle = {
  maxWidth: '560px',
  margin: '40px auto',
  backgroundColor: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
}
const headerStyle = { backgroundColor: '#050f2e', padding: '24px 36px' }
const logoStyle = {
  color: '#e6007e',
  fontSize: '28px',
  fontWeight: 900,
  letterSpacing: '-0.08em',
  margin: 0,
}
const contentStyle = { padding: '36px' }
const h2Style = { fontSize: '22px', fontWeight: 700, color: '#101828', margin: '0 0 16px' }
const textStyle = { fontSize: '15px', lineHeight: '1.6', color: '#344054', margin: '0 0 12px' }
const buttonStyle = {
  backgroundColor: '#e6007e',
  color: 'white',
  padding: '14px 28px',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallTextStyle = { fontSize: '13px', color: '#667085', lineHeight: '1.6', margin: '16px 0 0' }
const linkStyle = { color: '#0057d8' }
const hrStyle = { borderColor: '#e4e7ec', margin: '24px 0' }
const footerTextStyle = { fontSize: '12px', color: '#98a2b3', margin: 0 }

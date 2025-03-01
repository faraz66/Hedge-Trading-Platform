import { Box, Heading, SimpleGrid, Card, CardHeader, CardBody, Text, Badge, Stack } from '@chakra-ui/react'

export default function Strategies() {
  const strategies = [
    {
      name: 'Grid Strategy',
      description: 'A grid trading strategy that places buy and sell orders at regular price intervals',
      status: 'Active',
      parameters: ['Grid Size', 'Grid Spacing', 'Size Multiplier']
    },
    {
      name: 'Bollinger Breakout',
      description: 'Trading strategy based on Bollinger Bands breakouts with RSI confirmation',
      status: 'Available',
      parameters: ['BB Window', 'BB Standard Deviation', 'RSI Period']
    }
  ]

  return (
    <Box p={4}>
      <Heading mb={6}>Trading Strategies</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {strategies.map((strategy) => (
          <Card key={strategy.name}>
            <CardHeader>
              <Stack direction="row" justify="space-between" align="center">
                <Heading size="md">{strategy.name}</Heading>
                <Badge colorScheme={strategy.status === 'Active' ? 'green' : 'blue'}>
                  {strategy.status}
                </Badge>
              </Stack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>{strategy.description}</Text>
              <Text fontWeight="bold" mb={2}>Parameters:</Text>
              <Stack spacing={1}>
                {strategy.parameters.map((param) => (
                  <Text key={param} fontSize="sm" color="gray.600">
                    • {param}
                  </Text>
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
} 
import { cosmiconfig } from 'cosmiconfig';
import type { TicketreeConfig } from '@/config/types.js';

const explorer = cosmiconfig('ticketree', {
  searchPlaces: ['.ticketreerc', '.ticketreerc.yaml', '.ticketreerc.yml', '.ticketreerc.json'],
});

export const loadConfig = async (): Promise<TicketreeConfig> => {
  const result = await explorer.search();

  if (!result || result.isEmpty) {
    throw new Error('No .ticketreerc config file found. Run "ticketree init" first.');
  }

  return result.config as TicketreeConfig;
};

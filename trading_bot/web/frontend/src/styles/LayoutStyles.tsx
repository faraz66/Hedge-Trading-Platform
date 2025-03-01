import React from 'react'

interface LayoutStylesProps {
  colorMode: string
  colors: any
}

export const LayoutStyles = ({ colorMode, colors }: LayoutStylesProps) => (
  <style>
    {`
      /* Modern Layout Styles */
      .modern-navbar {
        backdrop-filter: blur(10px) !important;
        background: ${colorMode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 27, 30, 0.8)'} !important;
        border-bottom: 1px solid ${colors.borderColorContent} !important;
      }

      /* Tab Navigation */
      .chakra-tabs__tablist {
        display: flex !important;
        flex-direction: row !important;
        gap: 24px !important;
        padding: 16px 24px !important;
        background: transparent !important;
        border-bottom: 1px solid ${colors.borderColorContent} !important;
        margin-bottom: 24px !important;
        position: relative !important;
        width: 100% !important;
        justify-content: flex-start !important;
      }

      .chakra-tabs__tab {
        position: relative !important;
        padding: 8px 16px !important;
        color: ${colors.secondaryTextColor} !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        border-radius: 6px !important;
        transition: all 0.2s ease-in-out !important;
        background: transparent !important;
        border: none !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        white-space: nowrap !important;
      }

      /* Content Containers */
      .content-container {
        padding: 24px !important;
        background: ${colors.mainBg} !important;
        min-height: calc(100vh - 64px) !important;
        transition: all 0.2s ease-in-out !important;
      }

      .card-container {
        background: ${colors.cardBg} !important;
        border-radius: 12px !important;
        border: 1px solid ${colors.borderColorContent} !important;
        padding: 20px !important;
        margin-bottom: 24px !important;
      }

      /* Data Visualization */
      .data-visualization-container {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
        gap: 24px !important;
        width: 100% !important;
        margin-top: 24px !important;
      }

      /* Tables */
      .modern-table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }

      .modern-table th {
        background: ${colors.tableHeaderBg} !important;
        color: ${colors.tableHeaderColor} !important;
        font-weight: 600 !important;
        text-align: left !important;
        padding: 12px 16px !important;
      }

      .modern-table td {
        padding: 12px 16px !important;
        border-bottom: 1px solid ${colors.tableBorderColor} !important;
        color: ${colors.textColor} !important;
      }

      /* Forms */
      .modern-form-control {
        background: ${colors.inputBg} !important;
        border: 1px solid ${colors.borderColorContent} !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
        color: ${colors.inputColor} !important;
        transition: all 0.2s ease-in-out !important;
      }

      .modern-form-control:focus {
        border-color: ${colors.accentColor} !important;
        box-shadow: 0 0 0 1px ${colors.accentColor} !important;
      }

      /* Buttons */
      .modern-button {
        padding: 8px 16px !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease-in-out !important;
        cursor: pointer !important;
      }

      .modern-button-primary {
        background: ${colors.accentColor} !important;
        color: white !important;
      }

      .modern-button-secondary {
        background: transparent !important;
        border: 1px solid ${colors.borderColorContent} !important;
        color: ${colors.textColor} !important;
      }
    `}
  </style>
) 
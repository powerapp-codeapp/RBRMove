/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "aiissuegeneration": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "aitextformatting": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "iar_administratorses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_administratorsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_aiformattedlogses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_aiformattedlogsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_aiformattingcontextses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_aiformattingcontextsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_aigeneratedfieldeditlogses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_aigeneratedfieldeditlogsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_aigeneratedfieldlogses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_aigeneratedfieldlogsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_aiissuegeneratedlogses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_aiissuegeneratedlogsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_assessments": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_assessmentid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_engagementses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_engagementsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_issuebusinessownerses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_issuebusinessownersid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_issuecommentses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_issuecommentsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_issuelogses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_issuelogsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_issueses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_issuesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_procedureses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_proceduresid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_securityassignmentses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_securityassignmentsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_taxonomieses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_taxonomiesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_taxonomiesmasters": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_taxonomiesmasterid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "iar_tmroleses": {
    "tableId": "",
    "version": "",
    "primaryKey": "iar_tmrolesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {}
  }
};

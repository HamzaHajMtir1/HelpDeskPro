package com.helpdesk.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatResponseDTO {
    private String reply;
    private String phase;            // "DISCOVERY", "KB_FOUND", "COLLECT_INFO", "TICKET_READY"
    private List<KbResultDTO> kbResults;  // solutions trouvées
    private TicketDraftDTO draft;         // quand ticket prêt
}

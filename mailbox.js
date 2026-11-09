// Shared Library links use the same categories and anchors as the command reference.
(() => {
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nav = document.getElementById('filters');
  const select = document.getElementById('toolCategory');
  for (const category of ['all', ...Object.keys(commands)]) {
    const label = category === 'all' ? 'All commands' : category;
    const href = 'index.html' + (category === 'all' ? '' : '#category-' + slug(category));
    const link = document.createElement('a');
    link.textContent = label; link.href = href; nav.append(link);
    const option = document.createElement('option');
    option.textContent = label; option.value = href; select.append(option);
  }
  const option = document.createElement('option');
  option.textContent = 'Shared mailbox'; option.value = 'shared-mailbox-automapping.html'; option.selected = true; select.append(option);
  select.addEventListener('change', () => { location.href = select.value; });
  document.getElementById('catalogSummary').textContent = Object.values(commands).flat().length + ' commands · ' + Object.keys(commands).length + ' categories';
})();

(() => {
      'use strict';
      const $ = id => document.getElementById(id);
      const mailboxInput = $('mailbox');
      const delegateInput = $('delegate');
      const connectCode = `# If the module is missing, install it once in this PowerShell session:\n# Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser\nImport-Module ExchangeOnlineManagement -ErrorAction Stop\nConnect-ExchangeOnline -ErrorAction Stop`;
      $('connect-code').textContent = connectCode;
      let changeCode = '';
      let statusTimer;

      function validEmail(value) {
        if (value.length > 254 || !/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return false;
        const [local, domain] = value.split('@');
        return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && domain.length <= 253 && domain.split('.').every(label => label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
      }
      function psQuote(value) { return "'" + value.replaceAll("'", "''") + "'"; }
      function setHint(input, hintId, value) {
        const hint = $(hintId);
        const invalid = value !== '' && !validEmail(value);
        input.setAttribute('aria-invalid', String(invalid));
        hint.classList.toggle('error', invalid);
        hint.textContent = invalid ? 'Enter a valid email address, such as alex@contoso.com.' : input === mailboxInput ? 'Enter the shared mailbox’s SMTP address.' : 'Enter the individual user receiving FullAccess and Send As.';
      }
      function buildChange(mailbox, delegate, auto) {
        const autoLiteral = auto ? '$true' : '$false';
        return `# Run after connecting to Exchange Online. Review the targets and confirm at the prompt.
& {
    $mailbox = ${psQuote(mailbox)}
    $delegate = ${psQuote(delegate)}
    $autoMapping = ${autoLiteral}

    try {
        $target = Get-EXOMailbox -Identity $mailbox -ErrorAction Stop
        if ($null -eq $target -or $target.RecipientTypeDetails -ne 'SharedMailbox') {
            throw 'The target did not resolve to one shared mailbox.'
        }
        $principal = Get-EXORecipient -Identity $delegate -ErrorAction Stop
        if ($null -eq $principal -or $principal.RecipientTypeDetails -notin @('UserMailbox', 'MailUser')) {
            throw 'The delegate must resolve to an individual mailbox user or mail user.'
        }
        $mailboxId = $target.PrimarySmtpAddress.ToString()
        $entries = @(Get-MailboxPermission -Identity $mailboxId -User $delegate -ErrorAction Stop)
        $directDeny = @($entries | Where-Object {
            -not $_.IsInherited -and $_.Deny -and $_.AccessRights -contains 'FullAccess'
        })
        if ($directDeny.Count -gt 0) { throw 'A direct FullAccess deny exists; review it manually.' }
        $existing = @($entries | Where-Object {
            -not $_.IsInherited -and -not $_.Deny -and $_.AccessRights -contains 'FullAccess'
        })
        $sendAsEntries = @(Get-RecipientPermission -Identity $mailboxId -Trustee $delegate -ErrorAction Stop)
        $sendAsDeny = @($sendAsEntries | Where-Object {
            $_.AccessRights -contains 'SendAs' -and $_.AccessControlType -eq 'Deny'
        })
        if ($sendAsDeny.Count -gt 0) { throw 'A Send As deny exists; review it manually.' }
        $sendAs = @($sendAsEntries | Where-Object {
            $_.AccessRights -contains 'SendAs' -and $_.AccessControlType -eq 'Allow'
        })
    } catch {
        Write-Error "Preflight failed; no changes made: $($_.Exception.Message)"
        return
    }

    Write-Host "Shared mailbox: $mailboxId"
    Write-Host "Delegate: $($principal.PrimarySmtpAddress)"
    Write-Host "Direct FullAccess grant found: $($existing.Count -gt 0)"
    Write-Host "Requested automapping: $autoMapping"
    Write-Host "Existing Send As grant found: $($sendAs.Count -gt 0)"
    Write-Host 'Requested permissions: FullAccess and Send As'
    Write-Warning 'Removing an existing grant briefly interrupts access. Outlook changes may take time to appear.'
    $answer = Read-Host 'Type Y to apply this change'
    if ($answer -cne 'Y') { Write-Host 'Cancelled; no changes made.'; return }

    $removed = $false
    try {
        if ($existing.Count -gt 0) {
            Remove-MailboxPermission -Identity $mailboxId -User $delegate -AccessRights FullAccess -InheritanceType All -Confirm:$false -ErrorAction Stop
            $removed = $true
        }
        Add-MailboxPermission -Identity $mailboxId -User $delegate -AccessRights FullAccess -InheritanceType All -AutoMapping:${autoLiteral} -Confirm:$false -ErrorAction Stop | Out-Null
    } catch {
        Write-Error "Permission change failed: $($_.Exception.Message)"
        if ($removed) { Write-Warning 'The direct FullAccess grant may now be absent. Restore it manually before leaving this task.' }
        return
    }

    # Preserve an existing Send As grant; add one only when it is absent.
    try {
        if ($sendAs.Count -eq 0) {
            Add-RecipientPermission -Identity $mailboxId -Trustee $delegate -AccessRights SendAs -Confirm:$false -ErrorAction Stop | Out-Null
        }
    } catch {
        Write-Error "FullAccess was configured, but granting Send As failed: $($_.Exception.Message)"
        Write-Warning 'The change is incomplete. Review Send As permissions before reporting success.'
        return
    }

    try {
        $verified = @(Get-MailboxPermission -Identity $mailboxId -User $delegate -ErrorAction Stop | Where-Object {
            -not $_.IsInherited -and -not $_.Deny -and $_.AccessRights -contains 'FullAccess'
        })
        if ($verified.Count -eq 0) { throw 'No direct allowed FullAccess grant was returned.' }
        $verifiedSendAs = @(Get-RecipientPermission -Identity $mailboxId -Trustee $delegate -ErrorAction Stop | Where-Object {
            $_.AccessRights -contains 'SendAs' -and $_.AccessControlType -eq 'Allow'
        })
        if ($verifiedSendAs.Count -eq 0) { throw 'No allowed Send As grant was returned.' }
        Write-Host 'Verified: direct allowed FullAccess and Send As are present.' -ForegroundColor Green
        Write-Host 'The permission output does not show AutoMapping. Confirm Outlook behavior after propagation.'
    } catch {
        Write-Warning "The change ran, but verification did not confirm FullAccess and Send As: $($_.Exception.Message)"
    }
}`;
      }
      function update() {
        const mailbox = mailboxInput.value.trim();
        const webLink = validEmail(mailbox) ? 'https://outlook.office.com/mail/' + encodeURIComponent(mailbox).replace(/'/g, '%27').replace(/%40/g, '@') + '/' : '';
        $('mailbox-web-link').value = webLink;
        $('copy-mailbox-link').disabled = !webLink;
        const delegate = delegateInput.value.trim();
        const auto = document.querySelector('input[name="automapping"]:checked').value === 'true';
        setHint(mailboxInput, 'mailbox-hint', mailbox);
        setHint(delegateInput, 'delegate-hint', delegate);
        $('summary-mailbox').textContent = mailbox || 'Waiting for address';
        $('summary-delegate').textContent = delegate || 'Waiting for address';
        $('summary-action').textContent = 'FullAccess + Send As; automapping ' + (auto ? 'on' : 'off');
        $('choice-note').textContent = auto ? 'On allows Outlook to add this mailbox to the delegate’s profile automatically.' : 'Off keeps the mailbox out of automatic Outlook profile loading.';
        const ready = validEmail(mailbox) && validEmail(delegate) && mailbox.toLowerCase() !== delegate.toLowerCase();
        if (mailbox && delegate && mailbox.toLowerCase() === delegate.toLowerCase()) {
          $('delegate-hint').textContent = 'The delegate must be different from the shared mailbox.';
          $('delegate-hint').classList.add('error');
          delegateInput.setAttribute('aria-invalid', 'true');
        }
        changeCode = ready ? buildChange(mailbox, delegate, auto) : '';
        $('change-code').textContent = changeCode || 'Enter valid, different mailbox and delegate emails to generate the script.';
        $('change-code').classList.toggle('empty', !ready);
        $('copy-change').disabled = !ready;
        $('copy-all').disabled = !ready;
      }
      function announce(message) {
        const status = $('copy-status');
        status.textContent = message;
        status.classList.add('show');
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => status.classList.remove('show'), 3300);
      }
      async function copy(text, label) {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
          else {
            const box = document.createElement('textarea');
            box.value = text;
            box.style.position = 'fixed';
            box.style.opacity = '0';
            document.body.appendChild(box);
            try {
              box.select();
              if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
            } finally { box.remove(); }
          }
          announce(label + ' copied to clipboard.');
        } catch {
          announce('Copy was blocked. Select the text and copy it manually.');
        }
      }
      mailboxInput.addEventListener('input', update);
      $('copy-mailbox-link').addEventListener('click', () => {
        const link = $('mailbox-web-link').value;
        if (link) return copy(link, 'Mailbox link');
      });
      $('mailbox-web-link').addEventListener('click', event => event.target.select());
      delegateInput.addEventListener('input', update);
      document.querySelectorAll('input[name="automapping"]').forEach(input => input.addEventListener('change', update));
      $('copy-connect').addEventListener('click', () => copy(connectCode, 'Connection script'));
      $('copy-change').addEventListener('click', () => changeCode && copy(changeCode, 'Change script'));
      $('copy-all').addEventListener('click', () => changeCode && copy(connectCode + '\n\n' + changeCode, 'Entire script'));
      update();
    })();

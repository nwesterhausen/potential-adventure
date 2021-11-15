-- Save a text screen in markdown (eg for reddit)
-- This is a derivatiwe work based upon scripts/forum-dwarves.lua by Caldfir and expwnent
-- Adapted for markdown by Mchl https://github.com/Mchl
local helpstr = [====[

markdown
========
Save a copy of a text screen in markdown (useful for Reddit, among other sites).
See `forum-dwarves` for BBCode export (for e.g. the Bay12 Forums).

This script will attempt to read the current df-screen, and if it is a
text-viewscreen (such as the dwarf 'thoughts' screen or an item / creature
'description') or an announcement list screen (such as announcements and
combat reports) then append a marked-down version of this text to the
target file (for easy pasting on reddit for example).
Previous entries in the file are not overwritten, so you
may use the``markdown`` command multiple times to create a single
document containing the text from multiple screens (eg: text screens
from several dwarves, or text screens from multiple artifacts/items,
or some combination).

Usage::

    markdown [-n] [filename]

:-n:    overwrites contents of output file
:filename:
        if provided, save to :file:`md_{filename}.md` instead
        of the default :file:`md_export.md`

The screens which have been tested and known to function properly with
this script are:

#. dwarf/unit 'thoughts' screen
#. item/art 'description' screen
#. individual 'historical item/figure' screens
#. manual
#. announements screen
#. combat reports screen
#. latest news (when meeting with liaison)

There may be other screens to which the script applies.  It should be
safe to attempt running the script with any screen active, with an
error message to inform you when the selected screen is not appropriate
for this script.

]====]

local args = {...}

if args[1] == 'help' then
    print(helpstr)
    return
end

local writemode = 'a'

-- check if we want to append to an existing file (default) or overwrite previous contents
if args[1] == '-n' or args[1] == '/n' then
    writemode = 'w'
    table.remove(args, 1)
end

local filename

if args[1] ~= nil then
    filename = 'md_' .. table.remove(args, 1) .. '.md'
else
    filename = 'md_export.md'
end

local utils = require 'utils'
local gui = require 'gui'
local dialog = require 'gui.dialogs'

local scrn = dfhack.gui.getCurViewscreen()
local flerb = dfhack.gui.getFocusString(scrn)

local months = {
    [1] = 'Granite',
    [2] = 'Slate',
    [3] = 'Felsite',
    [4] = 'Hematite',
    [5] = 'Malachite',
    [6] = 'Galena',
    [7] = 'Limestone',
    [8] = 'Sandstone',
    [9] = 'Timber',
    [10] = 'Moonstone',
    [11] = 'Opal',
    [12] = 'Obsidian',
}

local relationship_types = {
    [-1] = "None",
    [0] =  "Pet",
    [1] =  "Spouse",
    [2] =  "Mother",
    [3] =  "Father",
    [4] =  "LastAttacker",
    [5] =  "GroupLeader",
    [6] =  "Draggee",
    [7] =  "Dragger",
    [8] =  "RiderMount",
    [9] =  "Lover",
    [10] = "unk10",
    [11] = "Sibling",
    [12] = "Child",
    [13] = "Friend",
    [14] = "Grudge",
    [15] = "Worship",
    [16] = "AcquaintanceLong",
    [17] = "AcquaintancePassing",
    [18] = "Bonded",
    [19] = "Hero",
    [20] = "ConsidersViolent",
    [21] = "ConsidersPsychotic",
    [22] = "GoodForBusiness",
    [23] = "FriendlyTerms",
    [24] = "ConsidersKiller",
    [25] = "ConsidersMurderer",
    [26] = "Comrade",
    [27] = "MemberOfRespectedGroup",
    [28] = "MemberOfHatedGroup",
    [29] = "EnemyFighter",
    [30] = "FriendlyFighter",
    [31] = "ConsidersBully",
    [32] = "ConsidersBrigand",
    [33] = "LoyalSoldier",
    [34] = "ConsidersMonster",
    [35] = "ConsidersStoryteller",
    [36] = "ConsidersPoet",
    [37] = "ConsidersBard",
    [38] = "ConsidersDancer",
    [39] = "Master",
    [40] = "Apprentice",
    [41] = "Companion",
    [42] = "FormerMaster",
    [43] = "FormerApprentice",
    [44] = "ConsidersQuarreler",
    [45] = "ConsidersFlatterer",
    [46] = "Hunter",
    [47] = "ProtectorOfTheWeak",

    [51] = "Pet"
}

local special_relationship_levels = {
    [10000] = "Mother",
    [9900] = "Father",
    [9800] = "GrandmotherPaternal",
    [9700] = "GrandfatherPaternal",
    [9600] = "GrandmotherMaternal",
    [9500] = "GrandfatherMaternal",
    [9300] = "Cousin"
}

local function getFileHandle()
    return io.open(filename, writemode)
end

local function closeFileHandle(handle)
    handle:write('\n***\n\n')
    handle:close()
    print ('Data exported to "' .. filename .. '"')
end

local function reformat(strin)
    local strout = strin

    -- [P] tags seem to indicate a new paragraph
    local newline_idx = string.find(strout, '[P]', 1, true)
    while newline_idx ~= nil do
        strout = string.sub(strout, 1, newline_idx - 1) .. '\n***\n\n' .. string.sub(strout, newline_idx + 3)
        newline_idx = string.find(strout, '[P]', 1, true)
    end

    -- [R] tags seem to indicate a new 'section'. Let's mark it with a horizontal line.
    newline_idx = string.find(strout, '[R]', 1, true)
    while newline_idx ~= nil do
        strout = string.sub(strout, 1, newline_idx - 1) .. '\n***\n\n' .. string.sub(strout,newline_idx + 3)
        newline_idx = string.find(strout, '[R]', 1, true)
    end

    -- No idea what [B] tags might indicate. Just removing them seems to work fine
    newline_idx = string.find(strout, '[B]', 1, true)
    while newline_idx ~= nil do
        strout = string.sub(strout, 1, newline_idx - 1) .. string.sub(strout,newline_idx + 3)
        newline_idx = string.find(strout, '[B]', 1, true)
    end

    -- Reddit doesn't support custom colors in markdown. We need to remove all color information :(
    local color_idx = string.find(strout, '[C:', 1, true)
    while color_idx ~= nil do
        strout = string.sub(strout, 1, color_idx - 1) .. string.sub(strout, color_idx + 9)
        color_idx = string.find(strout, '[C:', 1, true)
    end

    return strout
end

local function formattime(year, ticks)
    -- Dwarf Mode month is 33600 ticks long
    local month = math.floor(ticks / 33600)
    local dayRemainder = ticks - month * 33600

    -- Dwarf Mode day is 1200 ticks long
    local day = math.floor(dayRemainder / 1200)
    local timeRemainder = dayRemainder - day * 1200

    -- Assuming a 24h day each Dwarf Mode tick corresponds to 72 seconds
    local seconds = timeRemainder * 72

    local H = string.format("%02.f", math.floor(seconds / 3600));
    local m = string.format("%02.f", math.floor(seconds / 60 - (H * 60)));
    local i = string.format("%02.f", math.floor(seconds - H * 3600 - m * 60));

    day = day + 1
    if (day == 1 or day == 21) then
        day = day .. 'st' --luacheck: retype
    elseif (day == 2 or day == 22) then
        day = day .. 'nd' --luacheck: retype
    elseif (day == 3 or day == 23) then
        day = day .. 'rd' --luacheck: retype
    else
        day = day .. 'th' --luacheck: retype
    end

    return (day .. " " .. months[month + 1] .. " " .. year .. " " .. H .. ":" .. m..":" .. i)
end

-- SCRIPT FROM do-job-now.lua
local function getUnitName(unit)
    local language_name = dfhack.units.getVisibleName(unit)
    if language_name.has_name then
        return dfhack.df2utf(dfhack.TranslateName( language_name ))
    end
    
    -- animals
    return dfhack.units.getProfessionName(unit)
end

if flerb == 'textviewer' then
    local scrn = scrn --as:df.viewscreen_textviewerst
    printObj(scrn)
    local lines = scrn.src_text

    if lines ~= nil then

        local log = getFileHandle()
        log:write('### ' .. dfhack.df2utf(scrn.title) .. '\n')

        print('Exporting ' .. dfhack.df2console(scrn.title) .. '\n')

        for n,x in ipairs(lines) do
            log:write(reformat(dfhack.df2utf(x.value)).." ")
-- debug output
--            print(x.value)
        end
        closeFileHandle(log)
    end

elseif flerb == 'announcelist' then
    local scrn = scrn --as:df.viewscreen_announcelistst

    local lines = scrn.reports

    if lines ~= nil then
        local log = getFileHandle()
        local lastTime = ""

        for n,x in ipairs(lines) do
            local currentTime = formattime(x.year, x.time)
            if (currentTime ~= lastTime) then
                lastTime = currentTime
                log:write('\n***\n\n')
                log:write('## ' .. currentTime .. '\n')
            end
-- debug output
--            print(x.text)
            log:write(x.text .. '\n')
        end
        closeFileHandle(log)
    end


elseif flerb == 'topicmeeting' then
    local lines = scrn.text --hint:df.viewscreen_topicmeetingst

    if lines ~= nil then
        local log = getFileHandle()

        for n,x in ipairs(lines) do
-- debug output
--            print(x.value)
            log:write(x.value .. '\n')
        end
        closeFileHandle(log)
    end
-- MODIFIED BLOCK
elseif flerb == "layer_unit_relationship" then
    local scrn = dfhack.gui.getViewscreenByType(df.viewscreen_layer_unit_relationshipst)
    local whoRels = scrn.relation_textline
    local lvlRels = scrn.level
    local whatRels = scrn.relation_unit_type
    if #whoRels > 0 then
        local log = getFileHandle()
        log:write('#### ' .. getUnitName(scrn.unit) .. ' Extra Info\n\n')

        log:write('StressLevel: ' .. dfhack.units.getStressCategory(scrn.unit) .. '\n')

        for i=0,#whoRels-1 do
            local who = whoRels[i].value
            if who:find(",") then
                who = string.sub(who, 0, who:find(",")-1)
            end
            local rtype = relationship_types[whatRels[i]]
            if whatRels[i] == -1 then
                if special_relationship_levels[lvlRels[i]] ~= nil then
                    rtype = special_relationship_levels[lvlRels[i]]
                end
            end
            print(who .. ' : ' .. rtype .. ' (lvl ' .. lvlRels[i] .. ', type ' .. whatRels[i] .. ')')
            log:write(dfhack.df2utf(rtype .. ': "' .. who .. '"'))
            log:write("\n")
            
        end
        closeFileHandle(log)
    end    
-- MODIFIED BLOCK
else
    print 'This is not a textview, announcelist or topicmeeting screen. Can\'t export data, sorry.'
end
